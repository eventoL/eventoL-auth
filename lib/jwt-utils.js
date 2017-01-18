'use strict';

const jsonwebtoken = require('jsonwebtoken');

function getJWT(request) {
    if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
        return request.headers.authorization.split(' ')[1];
    } else if (request.query && request.query.jwt) {
        return request.query.jwt;
    }
    return undefined;
}

function decodeJWT(request) {
    return jsonwebtoken.decode(getJWT(request));
}

function extractJWT(request, response, next) {
    request.user = decodeJWT(request);
    next();
}

module.exports = {
    decodeJWT,
    extractJWT,
    getJWT
};
