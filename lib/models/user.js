'use strict';

const mongoose = require('mongoose');
const request  = require('request-promise');
const sodium   = require('sodium').api;
const moment   = require('moment');
const logger   = require('../logger');

const UserSchema = new mongoose.Schema({
    username: {
        type:     String,
        required: true,
        unique:   true
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
    password: {
        type:     String,
        required: true
    },
    blocked: {
        type:    Boolean,
        default: false
    },
    createdAt: {
        type:    Date,
        default: moment
    },
    updatedAt: {
        type:    Date,
        default: moment
    }
});

UserSchema.swaggerName = 'User';

UserSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    if (this.isNew) {
        this.password = sodium.crypto_pwhash_str(new Buffer(this.password),
            sodium.crypto_pwhash_OPSLIMIT_MODERATE, sodium.crypto_pwhash_MEMLIMIT_MODERATE);
    }
    next();
});

UserSchema.post('save', function(doc, next) {
    if (doc.wasNew) {
        request({
            method: 'POST',
            uri:    `${process.env.EVENTOL_AUTH_KONG_URL}/consumers`,
            body:   {
                username:  doc.username,
                custom_id: doc._id
            },
            json: true
        })
            .then((res) => {
                logger.info('Consumer created: ', res);
                next();
            });
    }
});

UserSchema.statics.login = function login(username, password) {
    return this
        .findOne({
            username
        })
        .exec()
        .then((user) => {
            if (user === null) {
                const notFound = new Error('The user was not found.');
                notFound.statusCode = 404;
                throw notFound;
            }

            if (!sodium.crypto_pwhash_str_verify(new Buffer(user.password), new Buffer(password))) {
                const forbidden = new Error('Wrong username/password.');
                forbidden.statusCode = 401;
                throw forbidden;
            }

            return user;
        });
};

module.exports = mongoose.model('User', UserSchema);
