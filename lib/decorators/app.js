'use strict';

function appDecorator(controller) {
    controller.request('post', function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            request.body.owner = request.user.profile.id;
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
