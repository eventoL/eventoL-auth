'use strict';

const baucis       = require('baucis');
const models       = require('./lib/models');
const jsonwebtoken = require('jsonwebtoken');

function getJwt(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.jwt) {
        return req.query.jwt;
    }
    return undefined;
}

function decodeJwt(req) {
    return jsonwebtoken.decode(getJwt(req));
}

function buildBaucis() {
    const userController = baucis.rest(models.User);
    userController.select('-password');
    const appController = baucis.rest(models.App);
    baucis.rest(models.AppUser);
    baucis.rest(models.HostedPages);
    baucis.rest(models.SocialConnection);

    appController.query(function(request, response, next) {
        const user = decodeJwt(request);
        request.baucis.query.where('owner').equals(user.profile.id);
        next();
    });

    return baucis();
}

module.exports = buildBaucis;
