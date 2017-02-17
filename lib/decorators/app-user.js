'use strict';

const App      = require('../models').App;
const User     = require('../models').User;
const validate = require('../validate');

function validateServiceJwt(request, response, next) {
    User.verifyJWT(request.jwt, request.user.profile.id)
        .then(() => next())
        .catch((error) => response.status(error.status).json({
            message: error.message
        }));
}

function decorator(controller) {
    controller.request('put post head delete', validateServiceJwt);

    controller.request('collection', 'get', validateServiceJwt);

    controller.request('instance', 'get', function(request, response, next) {
        User
            .verifyJWT(request.jwt, request.user.profile.id)
            .then(next)
            .catch(() => {
                validate(request.params.id !== request.user.profile.id, 'Invalid user id', 403);
                return App.findById(request.user.profile.app);
            })
            .then((app) => {
                validate(app === null || typeof app === 'undefined',
                    `Application not found: ${request.user.profile.app}`, 404);
                return app.verifyJWT(request.jwt);
            })
            .then(() => {
                request.user.profile.isApplicationUser = true;
                next();
            })
            .catch((error) => response.status(error.status).json({
                message: error.message
            }));
    });

    controller.request('post', function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            return App
                .fromUser(request.user.profile.id)
                .then((apps) => {
                    if (!apps.include(request.body.app)) {
                        return response.status(401).json({
                            message: 'You can only create users for the apps you own.'
                        });
                    }
                    return next();
                });
        }
        return next();
    });

    controller.query(function(request, response, next) {
        if (!request.user.profile.roles.includes('admin') && request.user.profile.isApplicationUser === false) {
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
