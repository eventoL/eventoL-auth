'use strict';

const mongoose = require('mongoose');
const moment   = require('moment');
const validate = require('../validate');
const logger   = require('../logger');

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

AppUserSchema.methods.isConnected = function isConnected(provider) {
    return this.identities.some((identity) => identity.provider === provider);
};

AppUserSchema.methods.link = function link(provider, connection, id, profile) {
    this.identities.push({
        userId:      id,
        isSocial:    true,
        profileData: profile,
        provider,
        connection
    });

    return this.save();
};

AppUserSchema.methods.unlink = function unlink(provider, connection) {
    const index = this.identities
        .findIndex((identity) => identity.provider === provider && identity.connection === connection);
    this.identities.splice(index, 1);
    return this.save();
};

AppUserSchema.pre('save', function preSaveHook(next) {
    /*eslint no-invalid-this: "off"*/
    this.wasNew = this.isNew;
    next();
});

AppUserSchema.post('save', function preSaveHook(doc) {
    const App = require('./app');
    App
        .findOne({
            _id: doc.app
        })
        .then((application) => {
            validate(application === null || typeof application === 'undefined', 'Application not found.', 404);
            let operation = doc.wasNew ? 'create' : 'update';

            return application.applyPlugins(doc, operation);
        })
        .catch(logger.error);

});

AppUserSchema.post('remove', function appUserRemoved(doc) {
    const App = require('./app');
    App
        .findOne({
            _id: doc.app
        })
        .then((application) => {
            validate(application === null || typeof application === 'undefined', 'Application not found.', 404);
            return application.applyPlugins(doc, 'remove');
        })
        .catch(logger.error);
});

AppUserSchema.swaggerName = 'AppUser';

module.exports = mongoose.model('AppUser', AppUserSchema);
