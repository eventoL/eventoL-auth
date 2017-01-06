'use strict';

const passport = require('passport');

function initializePassport(type, Strategy, id, provider, socialConnection) {
    let config;
    switch (type) {
        case 'oauth1':
            config = {
                consumerKey:    socialConnection.appId,
                consumerSecret: socialConnection.appSecret,
                callbackURL:    `${process.env.EVENTOL_AUTH_API_HOST}/api/app/${id}/${provider}/callback`,
                includeEmail:   true
            };
            break;
        case 'oauth2':
            config = {
                clientID:      socialConnection.appId,
                clientSecret:  socialConnection.appSecret,
                callbackURL:   `${process.env.EVENTOL_AUTH_API_HOST}/api/app/${id}/${provider}/callback`,
                profileFields: socialConnection.attributes
            };
            break;
        default:
            break;
    }

    passport.use(`${provider}|${id}`, new Strategy(config, function(accessToken, refreshToken, profile, cb) {
        return cb(null, profile);
    }));
}

module.exports = initializePassport;
