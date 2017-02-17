'use strict';

const jsonwebtoken = require('jsonwebtoken');
const validate     = require('./validate');

function get(request) {
    return new Promise(function(resolve, reject) {
        if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
            return resolve(request.headers.authorization.split(' ')[1]);
        }

        if (request.query && request.query.jwt) {
            return resolve(request.query.jwt);
        }

        const error = new Error('Unauthorized');
        error.status = 401;
        return reject(error);
    });
}

function decode(jwt) {
    const user = jsonwebtoken.decode(jwt);

    validate(user === null || typeof user === 'undefined', 'Unauthorized', 401);

    return user;
}

function extract(request, response, next) {
    get(request)
        .then((jwt) => {
            request.jwt = jwt;
            return decode(jwt);
        })
        .then((user) => {
            request.user = user;
            next();
        })
        .catch((error) => response.status(error.status).json({
            message: error.message
        }));
}

function verify(jwt, secret, options = {}) {
    return new Promise(function(resolve, reject) {
        jsonwebtoken.verify(jwt, secret, options, (error, decoded) => {
            if (error !== null || typeof error !== 'undefined') {
                return reject(error);
            }

            return resolve(decoded);
        });
    });
}

function issue(profile, clientSecret, jwtOptions) {
    return jsonwebtoken.sign({
        profile
    }, clientSecret + profile.id.toString(), jwtOptions);
}

module.exports = {
    decode,
    extract,
    get,
    verify,
    issue
};
