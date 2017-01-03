'use strict';

const jsonwebtoken = require('jsonwebtoken');

function signUser(user) {
    return jsonwebtoken.sign({
        profile: {
            id:    user._id.toString(),
            roles: user.roles
        }
    }, user.secret, {
        expiresIn: process.env.EVENTOL_AUTH_JWT_EXPIRES_IN,
        notBefore: process.env.EVENTOL_AUTH_JWT_NOT_BEFORE,
        issuer:    user._id.toString()
    });
}

module.exports = signUser;
