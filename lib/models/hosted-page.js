'use strict';

const mongoose = require('mongoose');
const moment   = require('moment');

const HostedPageSchema = new mongoose.Schema({
    app: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'App'
    },
    login: {
        html: {
            type:     String,
            required: true
        },
        createdAt: {
            type:    Date,
            default: moment
        },
        updatedAt: {
            type:    Date,
            default: moment
        }
    },
    passwordReset: {
        html: {
            type:     String,
            required: true
        },
        createdAt: {
            type:    Date,
            default: moment
        },
        updatedAt: {
            type:    Date,
            default: moment
        }
    },
    error: {
        html: {
            type:     String,
            required: true
        },
        createdAt: {
            type:    Date,
            default: moment
        },
        updatedAt: {
            type:    Date,
            default: moment
        }
    }
});

HostedPageSchema.swaggerName = 'HostedPage';

module.exports = mongoose.model('HostedPage', HostedPageSchema);
