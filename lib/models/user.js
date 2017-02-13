'use strict';

const mongoose  = require('mongoose');
const request   = require('request-promise');
const sodium    = require('sodium').api;
const moment    = require('moment');
const logger    = require('../logger');
const crypto    = require('crypto');
const base64url = require('base64url');
const validate  = require('../validate');
const kongUtils = require('../kong-utils');

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
    secret:        String,
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
    },
    roles: [String]
});

UserSchema.swaggerName = 'User';

UserSchema.pre('save', function(next) {
    /*eslint no-invalid-this: "off"*/
    this.wasNew = this.isNew;
    if (this.isNew) {
        this.password = sodium.crypto_pwhash_str(new Buffer(this.password),
            sodium.crypto_pwhash_OPSLIMIT_MODERATE, sodium.crypto_pwhash_MEMLIMIT_MODERATE);
        this.secret = base64url(crypto.randomBytes(128));
    }
    next();
});

UserSchema.post('save', function(doc, next) {
    if (doc.wasNew) {
        kongUtils.addConsumer(process.env.EVENTOL_AUTH_KONG_URL, doc._id)
            .then((res) => {
                logger.info('Consumer created: ', res);
                return kongUtils.addJWTCredentials(process.env.EVENTOL_AUTH_KONG_URL, doc._id, doc.secret);
            })
            .then((res) => {
                logger.info('Jwt config created: ', res);
                next();
            });
    }
    next();
});

UserSchema.post('remove', function(doc) {
    kongUtils.deleteConsumer(process.env.EVENTOL_AUTH_KONG_URL, doc._id);
});

UserSchema.statics.login = function login(username, password) {
    return this
        .findOne({
            username
        })
        .exec()
        .then((user) => {
            validate(user === null, 'The user was not found.', 404);
            validate(!sodium.crypto_pwhash_str_verify(new Buffer(user.password),
                    new Buffer(password)), 'Wrong username/password.', 401);

            return user;
        });
};

module.exports = mongoose.model('User', UserSchema);
