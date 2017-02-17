'use strict';

const App      = require('../models').App;
const JWT      = require('../JWT');
const validate = require('../validate');

function validateUserId(userProfile, id) {
    return new Promise((resolve) => {
        validate(userProfile.id !== id, 'Invalid token.', 401);
        resolve();
    });
}

function getJWTObject(req) {
    return JWT.get(req)
        .then((jwt) => {
            return JWT.decode(jwt)
                .then((user) => {
                    return {
                        user,
                        jwt
                    };
                });
        });
}

function linkProfile(req, res, next) {
    const userId     = req.swagger.params.userId.value;
    const provider   = req.swagger.params.identity.value.provider;
    const connection = req.swagger.params.identity.value.connection;
    const linkJwt    = req.swagger.params.identity.value.jwt;

    return getJWTObject(req)
        .then(({user, jwt}) => {
            return App.validate(user.profile.app, connection)
                .then((application) => {
                    return application
                        .verifyJWT(jwt)
                        .then((user) => {
                            validate(user.profile.blocked, 'The user is blocked.', 401);
                            return user;
                        })
                        .then((user) => {
                            return validateUserId(user.profile, userId)
                                .then(() => application.verifyJWT(linkJwt))
                                .then((userToLink) => application.link(user.profile.id,
                                    provider, connection, userToLink));
                        });
                });
        })
        .then((jwt) => res.status(200).json({
            jwt
        }))
        .catch(next);
}

function unlink(req, res, next) {
    const userId     = req.swagger.params.userId.value;
    const provider   = req.swagger.params.identity.value.provider;
    const connection = req.swagger.params.identity.value.connection;

    return getJWTObject(req)
        .then(({user, jwt}) => {
            return App.validate(user.profile.app, connection)
                .then((application) => {
                    return application
                        .verifyJWT(jwt)
                        .then((user) => {
                            validate(user.profile.blocked, 'The user is blocked.', 401);
                            return user;
                        })
                        .then((user) => {
                            return validateUserId(user.profile, userId)
                                .then(() => application.unlink(user.profile.id, provider, connection));
                        });
                });
        })
        .then((jwt) => res.status(200).json({
            jwt
        }))
        .catch(next);
}

module.exports = {
    linkProfile,
    unlink
};
