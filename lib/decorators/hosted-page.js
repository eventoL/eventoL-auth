'use strict';

const App = require('../models').App;

function decorator(controller) {
    controller.request('post', function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            return App
                .fromUser(request.user.profile.id)
                .then((apps) => {
                    if (!apps.include(request.body.app)) {
                        return response.status(401).json({
                            message: 'You can only create users of the apps you own.'
                        });
                    }
                    return next();
                });
        }
        return next();
    });

    controller.query(function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            return App
                .fromUser(request.user.profile.id)
                .then((apps) => {
                    request.baucis.query.where('app').in(apps);
                    return next();
                });

        }
        return next();
    });
}

module.exports = decorator;
