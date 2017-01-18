'use strict';

const crypto = require('crypto');

function appDecorator(controller) {
    controller.request('post', function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            request.body.owner = request.user.profile.id;
        }

        if (request.body.clientSecret === null || typeof request.body.clientSecret === 'undefined') {
            request.body.clientSecret = crypto.randomBytes(32).toString('hex');
        }

        next();
    });

    controller.query(function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            request.baucis.query.where('owner').equals(request.user.profile.id);
        }

        next();
    });
}

module.exports = appDecorator;
