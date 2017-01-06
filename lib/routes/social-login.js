'use strict';

const passport           = require('passport');
const socialAdapter      = require('../social-adapter');
const App                = require('../models').App;
const AppUser            = require('../models').AppUser;
const initializePassport = require('../initialize-passport');

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

module.exports = {
    socialLogin,
    callback
};
