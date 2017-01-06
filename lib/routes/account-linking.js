'use strict';

const App       = require('../models').App;
const AppUser   = require('../models').AppUser;
const decodeJwt = require('../extract-jwt').decodeJWT;

function validateUserId(userProfile, id) {
    return new Promise((resolve, reject) => {
        if (userProfile.id !== id) {
            const error = new Error('The user id given on the url doesn\'t match with the id of the jwt');
            error.status = 500;
            reject(error);
        }

        resolve();
    });
}

function linkProfile(req, res, next) {
    const userId   = req.swagger.params.userId.value;
    const provider = req.swagger.params.identity.value.provider;
    const linkJwt  = req.swagger.params.identity.value.jwt;
    const user     = decodeJwt(req).profile;

    return validateUserId(user, userId)
        .then(() => App.validate(user.app, provider))
        .then((application) => {
            return application
                .decodeToken(linkJwt)
                .then((userToLink) => {
                    const providerIdentity = userToLink.profile.identities
                        .filter((identity) => identity.provider === provider)[0];

                    if (providerIdentity === null || typeof providerIdentity === 'undefined') {
                        const error = new Error(`The user to link hasn't a ${provider} identity`);
                        error.status = 500;
                        throw error;
                    }

                    return AppUser.link(user.id, application, provider, providerIdentity.profileData);
                });
        })
        .then((jwt) => res.status(200).json({
            jwt
        }))
        .catch(next);
}

function unlink(req, res, next) {
    const userId   = req.swagger.params.userId.value;
    const provider = req.swagger.params.identity.value.provider;
    const user     = decodeJwt(req).profile;

    return validateUserId(user, userId)
        .then(() => App.validate(user.app, provider))
        .then((application) => AppUser.unlink(user.id, application, provider))
        .then((jwt) => res.status(200).json({
            jwt
        }))
        .catch(next);
}

module.exports = {
    linkProfile,
    unlink
};
