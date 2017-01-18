'use strict';

const passport = require('passport');

function initializePassport(type, Strategy, socialConnection, name, callbackUrl) {
    let config;

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

    passport.use(name, new Strategy(config, function(accessToken, refreshToken, profile, cb) {
        return cb(null, profile);
    }));
}

module.exports = initializePassport;
