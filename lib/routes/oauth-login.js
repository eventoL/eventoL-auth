'use strict';

const passport           = require('passport');
const oauthAdapters      = require('../oauth-adapter');
const App                = require('../models').App;
const initializePassport = require('../initialize-passport');
const JWTUtils           = require('../jwt-utils');

function findOauthConnection(application, provider) {
    return application.oauthConnections.filter((oauthConnection) => oauthConnection.connection === provider)[0];
}

function oauthLogin(req, res, next) {
    const appId        = req.swagger.params.appId.value;
    const provider     = req.swagger.params.provider.value;
    const strategyName = `${provider}|${appId}`;
    //const redirectUrl = req.swagger.params.redirectUrl.value;

    return App.validate(appId, provider)
        .then((application) => {
            const oauthConnection = findOauthConnection(application, provider);
            const oauthAdapter    = oauthAdapters[oauthConnection.type];
            const callbackUrl     = `${process.env.EVENTOL_AUTH_API_HOST}/api/apps/${appId}/${provider}/callback`;

            initializePassport(oauthAdapter.type, oauthAdapter.Strategy, oauthConnection, strategyName, callbackUrl);

            return oauthConnection;
        })
        .then((oauthConnection) => passport.authenticate(strategyName, {
            session: false,
            scope:   oauthConnection.permissions
        })(req, res, next))
        .catch(next);
}

function oauthCallback(req, res, next) {
    const appId    = req.swagger.params.appId.value;
    const provider = req.swagger.params.provider.value;

    return App
        .validate(appId, provider)
        .then((application) => {
            const oauthConnection = findOauthConnection(application, provider);
            const oauthAdapter    = oauthAdapters[oauthConnection.type];

            passport.authenticate(`${provider}|${appId}`, {
                session: oauthAdapter.type === 'oauth1'
            }, function(error, profile) {
                if (error) {
                    return next(error);
                }

                return application
                    .connect(oauthConnection.type, oauthConnection.connection, profile)
                    .then((jwt) => res.status(200).json({
                        jwt
                    }))
                    .catch(next);
            })(req, res, next);
        })
        .catch(next);
}

function linkUserLogin(req, res, next) {
    const connection = req.swagger.params.connection.value;
    const appId      = req.swagger.params.appId.value;
    const userJWT    = JWTUtils.getJWT(req);
    //const redirectUrl = req.swagger.params.redirectUrl.value;
    const strategyName = `${connection}|${appId}`;


    return App.validate(appId, connection)
        .then((application) => {
            return application
                .verifyJWT(userJWT)
                .then(() => application);
        })
        .then((application) => {
            const oauthConnection = findOauthConnection(application, connection);
            const oauthAdapter    = oauthAdapters[oauthConnection.type];
            const callbackUrl     = `${process.env.EVENTOL_AUTH_API_HOST}/api/apps/${appId}/${connection}/link/callback`;

            initializePassport(oauthAdapter.type, oauthAdapter.Strategy, oauthConnection, strategyName, callbackUrl);

            return oauthConnection;
        })
        .then((oauthConnection) => passport.authenticate(strategyName, {
            session: false,
            scope:   oauthConnection.permissions
        })(req, res, next))
        .catch(next);
}

function linkCallback(req, res, next) {
    const appId      = req.swagger.params.appId.value;
    const connection = req.swagger.params.connection.value;

    return App
        .validate(appId, connection)
        .then((application) => {
            const oauthConnection = findOauthConnection(application, connection);
            const oauthAdapter    = oauthAdapters[oauthConnection.type];

            passport.authenticate(`${connection}|${appId}`, {
                session: oauthAdapter.type === 'oauth1'
            }, function(error, profile) {
                if (error) {
                    return next(error);
                }

                return application
                    .createLinkUser(oauthConnection.type, oauthConnection.connection, profile)
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
    linkUserLogin,
    oauthCallback,
    linkCallback
};
