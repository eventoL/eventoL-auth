'use strict';

function validateAdmin(request, response, next) {
    if (!request.user.profile.roles.includes('admin')) {
        return response.send(401);
    }

    return next();
}

function decorator(controller) {
    controller.request(validateAdmin);
}

module.exports = decorator;
