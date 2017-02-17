'use strict';

const App      = require('../models').App;
const JWT      = require('../JWT');
const validate = require('../validate');

function listAppUsers(req, res, next) {
    const appId = req.swagger.params.appId.value;

    return JWT
        .get(req)
        .then(JWT.decode)
        .then((user) => {
            return App
                .findOne({
                    _id: appId
                })
                .then((application) => {
                    validate(application === null || typeof application === 'undefined', 'Application not found.', 404);

                    if (!user.profile.roles.includes('admin')) {
                        validate(application.owner.toString() !== user.profile.id,
                            'You aren\'t the owner of the application.', 403);
                    }

                    return application.getUsers();
                });
        })
        .then((appusers) => res.status(200).json(appusers))
        .catch(next);
}

module.exports = {
    listAppUsers
};
