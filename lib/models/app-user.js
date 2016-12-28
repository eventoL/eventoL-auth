'use strict';

const mongoose = require('mongoose');
const moment   = require('moment');

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
            profileData: mongoose.Schema.Types.Mixed
        }
    ]
});

AppUserSchema.swaggerName = 'AppUser';

module.exports = mongoose.model('AppUser', AppUserSchema);
