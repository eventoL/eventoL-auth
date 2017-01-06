'use strict';

const passport           = require('passport');
const socialAdapter      = require('../social-adapter');
const App                = require('../models').App;
const AppUser            = require('../models').AppUser;
const initializePassport = require('../initialize-passport');
const decodeJwt          = require('../extract-jwt').decodeJWT;

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

function socialLogin(req, res, next) {
    const appId    = req.swagger.params.appId.value;
    const provider = req.swagger.params.provider.value;
    //const redirectUrl = req.swagger.params.redirectUrl.value;

    return App.validate(appId, provider)
        .then((application) => {
            const providerConnection = application.socialConnections
                .filter((socialConnection) => socialConnection.type === provider)[0];
            initializePassport(socialAdapter[provider].type, socialAdapter[provider].strategy,
                appId, provider, providerConnection);
            return providerConnection;
        })
        .then((providerConnection) => passport.authenticate(`${provider}|${appId}`, {
            session: false,
            scope:   providerConnection.permissions
        })(req, res, next))
        .catch(next);
}

function callback(req, res, next) {
    const appId    = req.swagger.params.appId.value;
    const provider = req.swagger.params.provider.value;

    return App
        .validate(appId, provider)
        .then((application) => passport.authenticate(`${provider}|${appId}`, {
            session: socialAdapter[provider].type === 'oauth1'
        }, function(error, profile) {
            if (error) {
                return next(error);
            }

            return AppUser
                .connect(application, provider, profile)
                .then((jwt) => res.status(200).json({
                    jwt
                }))
                .catch(next);
        })(req, res, next))
        .catch(next);
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
    socialLogin,
    callback,
    linkProfile,
    unlink
};
