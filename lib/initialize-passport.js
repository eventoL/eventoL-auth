'use strict';

const passport = require('passport');

function initializePassport(type, Strategy, id, provider, socialConnection) {
    let config;
    const callbackUrl = `${process.env.EVENTOL_AUTH_API_HOST}/api/app/${id}/${provider}/callback`;
    switch (type) {
        case 'oauth1':
            config = {
                consumerKey:    socialConnection.appId,
                consumerSecret: socialConnection.appSecret,
                callbackURL:    callbackUrl,
                includeEmail:   true
            };
            break;
        case 'oauth2':
            config = {
                clientID:      socialConnection.appId,
                clientSecret:  socialConnection.appSecret,
                callbackURL:   callbackUrl,
                profileFields: socialConnection.attributes
            };
            break;
        case 'ldap-oauth2':
            config = {
                authorizationURL: socialConnection.authorizationUrl,
                tokenURL:         socialConnection.tokenUrl,
                clientID:         socialConnection.appId,
                clientSecret:     socialConnection.appSecret,
                callbackURL:      callbackUrl,
                profileFields:    socialConnection.attributes,
                profileURL:       socialConnection.profileUrl
            };
        default:
            break;
    }

    passport.use(`${provider}|${id}`, new Strategy(config, function(accessToken, refreshToken, profile, cb) {
        return cb(null, profile);
    }));
}

module.exports = initializePassport;
