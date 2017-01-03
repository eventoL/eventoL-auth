'use strict';

const validateAdmin = require('./validate-admin');

function decorator(controller) {
    controller.select('-password -secret');

    controller.request('post', validateAdmin);

    controller.request('collection', 'delete get', validateAdmin);

    controller.request('instance', 'get put delete', function(request, response, next) {
        const validateOwnOperation = !request.user.profile.roles.includes('admin') &&
            request.params.id !== request.user.profile.id;
        if (validateOwnOperation) {
            return response.status(401).json({
                message: 'You don\'t have permission to access other users'
            });
        }
        return next();
    });
}

module.exports = decorator;
