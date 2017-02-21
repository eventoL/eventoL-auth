'use strict';

const mongoose     = require('mongoose');
const JWT          = require('../JWT');
const oauthAdapter = require('../oauth-adapter');
const AppUser      = require('./app-user');
const LinkUser     = require('./link-user');
const validate     = require('../validate');
const plugins      = require('../plugins');
const pick         = require('lodash/pick');

const AppSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User'
    },
    name: {
        type:     String,
        required: true,
        unique:   true
    },
    clientSecret: {
        type:     String,
        required: true,
        unique:   true
    },
    localLoginEnabled: {
        type:    Boolean,
        default: false
    },
    minimalUserEnabled: {
        type:    Boolean,
        default: false
    },
    plugins: {
        type: [
            {
                _id:     false,
                context: mongoose.Schema.Types.Mixed,
                name:    {
                    type:     String,
                    required: true
                },
                issueTokenEnabled: {
                    type:    Boolean,
                    default: false
                }
            }
        ],
        default: []
    },
    oauthConnections: [{
        _id:  false,
        type: {
            type: String,
            ref:  'OauthConnection'
        },
        connection: {
            type:     String,
            required: true
        },
        appId: {
            type:     String,
            required: true
        },
        appSecret: {
            type:     String,
            required: true
        },
        signupEnabled: {
            type:    Boolean,
            default: true
        },
        attributes: {
            type:    [String],
            default: []
        },
        permissions: {
            type:    [String],
            default: []
        },
        authorizationUrl: String,
        tokenUrl:         String,
        profileUrl:       String
    }],
    callbackUrls:  [String],
    logoutUrls:    [String],
    jwtExpiration: {
        type:    Number,
        default: 36000
    },
    hostedPages: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'HostedPage'
    },
    defaultRoles: {
        type:    [String],
        default: []
    },
    whiteList: {
        type:    [String],
        default: []
    },
    roles: [{
        _id:      false,
        roleName: {
            type:     String,
            required: true
        },
        roleDescription: {
            type:    String,
            default: ''
        }
    }]
});

AppSchema.statics.fromUser = function fromUser(id) {
    return this.find(
        {
            owner: id
        }, {
            _id: 1
        })
        .exec()
        .then((docs) => docs.map((doc) => doc._id));
};

AppSchema.statics.validate = function validateApp(id, connection) {
    return this
        .findOne({
            _id: id
        })
        .then((application) => {
            validate(application === null || typeof application === 'undefined', `Application ${id} not found.`, 404);

            const applicationProviders = application.oauthConnections
                .map((socialConnection) => socialConnection.connection);

            validate(!applicationProviders.includes(connection), `${connection} is not available for this app`, 500);

            return application;
        });
};

AppSchema.methods.verifyJWT = function verifyJWT(jwt) {
    if (this.hasIssueTokenPlugin()) {
        return this.getIssueTokenPlugin().verifyJWT(jwt, this.clientSecret);
    }

    return JWT.verify(jwt, this.clientSecret);
};

AppSchema.methods.issueToken = function issueToken(profile) {
    let profileToSign = profile;
    const id          = profileToSign._id.toString();
    profileToSign.id = id;

    Reflect.deleteProperty(profileToSign, '_id');
    Reflect.deleteProperty(profileToSign, '__v');

    if (this.minimalUserEnabled) {
        profileToSign = pick(profileToSign, ['id', 'app', 'roles']);
    }

    const jwtOptions = {
        expiresIn: this.jwtExpiration,
        notBefore: '1ms',
        issuer:    id
    };

    if (this.hasIssueTokenPlugin()) {
        return this.getIssueTokenPlugin().issueToken(profileToSign, this.clientSecret, jwtOptions);
    }

    return JWT.issue(profileToSign, this.clientSecret, jwtOptions);
};

AppSchema.methods.connect = function connect(provider, connection, profile) {
    const email = oauthAdapter[provider].getEmail(profile);
    return AppUser
        .findOne({
            app: this._id,
            email
        })
        .then((user) => {
            const oauthConnection = this.oauthConnections
                .filter((oauthConnection) => oauthConnection.connection === connection)[0];

            validate(!oauthConnection.signupEnabled,
                `${provider} is not available for registration in this app`, 404);

            if (user === null || typeof user === 'undefined') {
                validate(this.whiteList.length > 0 && !this.whiteList.includes(email),
                    `The email ${email} isn't part of the application's white list.`, 403);

                return this.createFor(AppUser, provider, connection, profile, false);
            }

            validate(user.blocked, 'The user is blocked', 401);

            if (!user.isConnected(provider)) {
                return user.link(provider, connection, profile._json.id,
                    this.getProfileAttributes(provider, connection, profile._json));
            }

            return user;
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.methods.createLinkUser = function createLinkUser(provider, connection, profile) {
    return AppUser
        .findOne({
            app:        this._id,
            identities: {
                $elemMatch: {
                    userId: profile.id,
                    connection,
                    provider
                }
            }
        })
        .then((user) => {
            validate(user !== null && typeof user !== 'undefined',
                `The user is already linked with this ${provider} identity`, 500);

            return this.createFor(LinkUser, provider, connection, profile, true);
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.methods.createFor = function createFor(collection, provider, connection, profile, blocked) {
    const user = Object.assign(oauthAdapter[provider].format(profile), {
        app:          this._id,
        roles:        this.defaultRoles,
        app_metadata: this.app_metadata,
        identities:   [{
            userId:      profile._json.id,
            isSocial:    true,
            profileData: this.getProfileAttributes(provider, connection, profile._json),
            provider,
            connection
        }],
        blocked
    });

    return collection.create(user);
};

AppSchema.methods.getProfileAttributes = function getProfileAttributes(provider, connection, profile) {
    const oauthConnection = this.oauthConnections.filter((oauthConnection) => oauthConnection.connection === connection &&
        oauthConnection.type === provider)[0];
    return pick(profile, oauthConnection.attributes);
};

AppSchema.methods.link = function link(id, provider, connection, userToLink) {
    return AppUser
        .findById(id)
        .then((user) => {
            const providerIdentity = userToLink.profile.identities
                .filter((identity) => identity.provider === provider)[0];

            validate(providerIdentity === null || typeof providerIdentity === 'undefined',
                `The user to link hasn't got a ${provider} identity.`, 500);

            validate(user === null || typeof user === 'undefined', `The user ${id} was not found.`, 404);

            validate(user.isConnected(provider), `The user has already linked a ${provider} account.`, 401);

            return user.link(provider, connection, providerIdentity.profileData);
        })
        .then((user) => {
            return LinkUser
                .remove({
                    _id: userToLink.profile.id
                })
                .then(() => user);
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.methods.unlink = function unlink(id, provider, connection) {
    return AppUser
        .findById(id)
        .then((user) => {
            validate(user === null || typeof user === 'undefined', `The user ${id} was not found.`, 404);

            validate(!user.isConnected(provider), `The user hasn't got a linked ${provider} account.`, 401);

            return user.unlink(provider, connection);
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.methods.getUsers = function getUsers() {
    return AppUser
        .find({
            app: this._id
        })
        .exec();
};

AppSchema.methods.hasIssueTokenPlugin = function hasIssueTokenPlugin() {
    return this.plugins.some((plugin) => plugin.issueTokenEnabled);
};

AppSchema.methods.getIssueTokenPlugin = function getIssueTokenPlugin() {
    const pluginName = this.plugins.filter((plugin) => plugin.issueTokenEnabled)[0].name;
    return plugins[pluginName];
};

AppSchema.methods.applyPlugins = function applyPlugins(user, operation) {
    const userPromise = new Promise((resolve) => resolve(user));
    return this.plugins.reduce((userPromise, pluginDoc) => {
        const plugin = plugins[pluginDoc.name];
        return userPromise
            .then((user) => Reflect.apply(plugin[operation], plugin, [pluginDoc.context, this, user]));
    }, userPromise);
};

AppSchema.swaggerName = 'App';

module.exports = mongoose.model('App', AppSchema);
