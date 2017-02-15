'use strict';

const jsonwebtoken = require('jsonwebtoken');
const validate     = require('./validate');

function getJWT(request) {
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

function decodeJWT(jwt) {
    const user = jsonwebtoken.decode(jwt);

    validate(user === null || typeof user === 'undefined', 'Unauthorized', 401);

    return user;
}

function extractJWT(request, response, next) {
    getJWT(request)
        .then((jwt) => {
            request.jwt = jwt;
            return decodeJWT(jwt);
        })
        .then((user) => {
            request.user = user;
            next();
        })
        .catch((error) => response.status(error.status).json({
            message: error.message
        }));
}

module.exports = {
    decodeJWT,
    extractJWT,
    getJWT
};
