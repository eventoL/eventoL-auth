'use strict';

const mongoose     = require('mongoose');
const jsonwebtoken = require('jsonwebtoken');
const oauthAdapter = require('../oauth-adapter');
const AppUser      = require('./app-user');
const validate     = require('../validate');

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
    oauthConnections: [{
        _id:  false,
        type: {
            type: String,
            ref:  'SocialConnection'
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
        attributes:       [String],
        permissions:      [String],
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
        default: ['user']
    },
    whiteList: {
        type:    [String],
        default: []
    },
    roles: [String]
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
    return new Promise((resolve, reject) => {
        jsonwebtoken.verify(jwt, this.clientSecret, (error, user) => {
            if (error) {
                return reject(error);
            }

            return resolve(user);
        });
    });
};

AppSchema.methods.issueToken = function issueToken(user) {
    const id = user._id.toString();
    user.id = id;

    Reflect.deleteProperty(user, '_id');
    Reflect.deleteProperty(user, '__v');

    return jsonwebtoken.sign({
        profile: user
    }, this.clientSecret, {
        expiresIn: this.jwtExpiration,
        notBefore: '1ms',
        issuer:    id
    });
};

AppSchema.methods.connect = function connect(provider, connection, profile) {
    const email = oauthAdapter[provider].getEmail(profile);
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
            if (user === null || typeof user === 'undefined') {
                const oauthConnection = this.oauthConnections
                    .filter((oauthConnection) => oauthConnection.connection === connection)[0];

                validate(!oauthConnection.signupEnabled,
                    `The ${provider} profile haven't been connected to an existing user.`, 404);

                validate(this.whiteList.length > 0 && !this.whiteList.includes(email),
                    `The email ${email} isn't part off the application's white list.`, 403);

                return this.createFor(provider, connection, profile, false);
            }

            validate(user.blocked, 'The user is blocked', 401);

            if (!user.isConnected(provider) && user.email === email) {
                return user.link(provider, connection, profile._json);
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
                `There is already a user with this ${provider} identity linked.`, 500);

            return this.createFor(provider, connection, profile, true);
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.methods.createFor = function createFor(provider, connection, profile, blocked) {
    const user = Object.assign(oauthAdapter[provider].format(profile), {
        app:          this._id,
        roles:        this.defaultRoles,
        app_metadata: this.app_metadata,
        identities:   [{
            userId:      profile._json.id,
            isSocial:    true,
            profileData: profile._json,
            provider,
            connection
        }],
        blocked
    });

    return AppUser
        .create(user);
};

AppSchema.methods.link = function link(id, provider, connection, userToLink) {
    return AppUser
        .findOne({
            _id: id
        })
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
            return AppUser
                .remove({
                    _id: userToLink.profile.id
                })
                .then(() => user);
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.methods.unlink = function unlink(id, provider, connection) {
    return AppUser
        .findOne({
            _id: id
        })
        .then((user) => {
            validate(user === null || typeof user === 'undefined', `The user ${id} was not found.`, 404);

            validate(!user.isConnected(provider), `The user hasn't got a linked ${provider} account.`, 401);

            return user.unlink(provider, connection);
        })
        .then((user) => this.issueToken(user.toObject()));
};

AppSchema.swaggerName = 'App';

module.exports = mongoose.model('App', AppSchema);
