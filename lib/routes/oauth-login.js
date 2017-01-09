'use strict';

const passport           = require('passport');
const oauthAdapter       = require('../oauth-adapter');
const App                = require('../models').App;
const AppUser            = require('../models').AppUser;
const initializePassport = require('../initialize-passport');

function findOauthConnection(application, provider) {
    return application.oauthConnections.filter((oauthConnection) => oauthConnection.connection === provider)[0];
}

function oauthLogin(req, res, next) {
    const appId    = req.swagger.params.appId.value;
    const provider = req.swagger.params.provider.value;
    //const redirectUrl = req.swagger.params.redirectUrl.value;

    return App.validate(appId, provider)
        .then((application) => {
            const oauthConnection = findOauthConnection(application, provider);
            initializePassport(oauthAdapter[oauthConnection.type].type,
                oauthAdapter[oauthConnection.type].Strategy, appId,
                provider, oauthConnection);
            return oauthConnection;
        })
        .then((oauthConnection) => passport.authenticate(`${provider}|${appId}`, {
            session: false,
            scope:   oauthConnection.permissions
        })(req, res, next))
        .catch(next);
}

function callback(req, res, next) {
    const appId    = req.swagger.params.appId.value;
    const provider = req.swagger.params.provider.value;

    return App
        .validate(appId, provider)
        .then((application) => {
            const oauthConnection = findOauthConnection(application, provider);
            passport.authenticate(`${provider}|${appId}`, {
                session: oauthAdapter[oauthConnection.type].type === 'oauth1'
            }, function(error, profile) {
                if (error) {
                    return next(error);
                }

                return AppUser
                    .connect(application, oauthConnection.type, oauthConnection.connection, profile)
                    .then((jwt) => res.status(200).json({
                        jwt
                    }))
                    .catch(next);
            })(req, res, next);
        })
        .catch(next);
}

module.exports = {
    oauthLogin,
    callback
};
