'use strict';

const jsonwebtoken = require('jsonwebtoken');

function getJwt(request) {
    if (request.headers.authorization && request.headers.authorization.split(' ')[0] === 'Bearer') {
        return request.headers.authorization.split(' ')[1];
    } else if (request.query && request.query.jwt) {
        return request.query.jwt;
    }
    return undefined;
}

function decodeJwt(request) {
    return jsonwebtoken.decode(getJwt(request));
}

function extractJwt(request, response, next) {
    request.user = decodeJwt(request);
    next();
}

module.exports = extractJwt;
