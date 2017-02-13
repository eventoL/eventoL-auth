'use strict';

const mongoose = require('mongoose');

const OauthConnectionSchema = new mongoose.Schema({
    _id: {
        type:     String,
        required: true,
        unique:   true
    },
    attributes: [{
        _id:          false,
        providerName: {
            type:     String,
            required: true,
            unique:   true
        },
        clientName: {
            type:     String,
            required: true,
            unique:   true
        },
        required: {
            type:     Boolean,
            default:  false,
            required: true
        }
    }],
    permissions: [{
        _id:          false,
        providerName: {
            type:     String,
            required: true,
            unique:   true
        },
        clientName: {
            type:     String,
            required: true,
            unique:   true
        },
        required: {
            type:     Boolean,
            default:  false,
            required: true
        }
    }]
});

OauthConnectionSchema.swaggerName = 'OauthConnection';

module.exports = mongoose.model('OauthConnection', OauthConnectionSchema);
