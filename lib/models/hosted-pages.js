'use strict';

const mongoose = require('mongoose');
const moment   = require('moment');

const HostedPagesSchema = new mongoose.Schema({
    login: {
        html: {
            type:     String,
            required: true,
            unique:   true
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
            required: true,
            unique:   true
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
            required: true,
            unique:   true
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

HostedPagesSchema.swaggerName = 'HostedPages';

module.exports = mongoose.model('HostedPages', HostedPagesSchema);
