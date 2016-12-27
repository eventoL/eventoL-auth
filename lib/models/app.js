'use strict';

const mongoose = require('mongoose');

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
    clientId: {
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
    socialConnections: [{
        type: {
            type: String,
            ref:  'SocialConnection'
        },
        appId: {
            type:     String,
            required: true
        },
        appSecret: {
            type:     String,
            required: true
        },
        attributes:  [String],
        permissions: [String]
    }],
    callbackUrls:  [String],
    logoutUrls:    [String],
    jwtExpiration: {
        type:    Number,
        default: 36000
    }
});

AppSchema.swaggerName = 'App';

module.exports = mongoose.model('App', AppSchema);
