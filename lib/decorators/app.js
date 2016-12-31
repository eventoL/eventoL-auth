'use strict';

const extractJwt = require('./extract-jwt');

function appDecorator(controller) {
    controller.request(extractJwt);
    controller.query(function(request, response, next) {
        request.baucis.query.where('owner').equals(request.user.profile.id);
        next();
    });
}

module.exports = appDecorator;
