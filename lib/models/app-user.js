'use strict';

const mongoose     = require('mongoose');
const moment       = require('moment');
const oauthAdapter = require('../oauth-adapter');

const AppUserSchema = new mongoose.Schema({
    app: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'App'
    },
    roles:        [String],
    appMetadata:  mongoose.Schema.Types.Mixed,
    userMetadata: mongoose.Schema.Types.Mixed,
    blocked:      {
        type:    Boolean,
        default: false
    },
    createdAt: {
        type:    Date,
        default: moment
    },
    email: {
        type:     String,
        required: true,
        unique:   true
    },
    emailVerified: {
        type:    Boolean,
        default: false
    },
    nickname: {
        type: String
    },
    picture: {
        type: String
    },
    updatedAt: {
        type:    Date,
        default: moment
    },
    familyName: {
        type: String
    },
    givenName: {
        type: String
    },
    identities: [
        {
            provider: {
                type:     String,
                required: true
            },
            userId: {
                type:     String,
                required: true
            },
            connection: {
                type:     String,
                required: true
            },
            isSocial: {
                type:     Boolean,
                required: true
            },
            profileData: mongoose.Schema.Types.Mixed,
            _id:         false
        }
    ]
});

AppUserSchema.statics.connect = function connect(application, provider, connection, profile) {
    return this
        .findOne({
            app:   application._id,
            email: oauthAdapter[provider].getEmail(profile)
        })
        .then((user) => {
            if (user === null || typeof user === 'undefined') {
                return this.createFor(application, provider, connection, profile);
            }

            if (!user.isConnected(provider)) {
                return user.link(provider, connection, profile._json);
            }

            return user;
        })
        .then((user) => application.issueToken(user.toObject()));
};

AppUserSchema.statics.link = function link(id, application, provider, connection, profile, idToRemove) {
    return this
        .findOne({
            _id: id
        })
        .then((user) => {
            if (user === null || typeof user === 'undefined') {
                const error = new Error(`The user ${id} was not found.`);
                error.status = 404;
                throw error;
            }

            if (user.isConnected(provider)) {
                const error = new Error('The user has already linked a ${provider} account.');
                error.status = 401;
                throw error;
            }

            return user.link(provider, connection, profile);
        })
        .then((user) => {
            return this
                .remove({
                    _id: idToRemove
                })
                .then(() => user);
        })
        .then((user) => application.issueToken(user.toObject()));
};

AppUserSchema.statics.unlink = function unlink(id, application, provider, connection) {
    return this
        .findOne({
            _id: id
        })
        .then((user) => {
            if (user === null || typeof user === 'undefined') {
                const error = new Error(`The user ${id} was not found.`);
                error.status = 404;
                throw error;
            }

            if (!user.isConnected(provider)) {
                const error = new Error(`The user hasn't got a linked ${provider} account.`);
                error.status = 401;
                throw error;
            }

            return user.unlink(provider, connection);
        })
        .then((user) => application.issueToken(user.toObject()));
};

AppUserSchema.statics.createFor = function createFor(application, provider, connection, profile) {
    const user = Object.assign(oauthAdapter[provider].format(profile), {
        app:          application._id,
        roles:        application.defaultRoles,
        app_metadata: application.app_metadata,
        identities:   [{
            provider:    provider,
            userId:      profile._json.id,
            isSocial:    true,
            connection:  connection,
            profileData: profile._json
        }]
    });

    return this
        .create(user);
};

AppUserSchema.methods.isConnected = function isConnected(provider) {
    return this.identities.some((identity) => identity.provider === provider);
};

AppUserSchema.methods.link = function link(provider, connection, profile) {
    this.identities.push({
        provider:    provider,
        userId:      profile.id,
        isSocial:    true,
        connection:  connection,
        profileData: profile
    });

    return this.save();
};

AppUserSchema.methods.unlink = function unlink(provider, connection) {
    const index = this.identities
        .findIndex((identity) => identity.provider === provider && identity.connection === connection);
    this.identities.splice(index, 1);
    return this.save();
};

AppUserSchema.swaggerName = 'AppUser';

module.exports = mongoose.model('AppUser', AppUserSchema);
