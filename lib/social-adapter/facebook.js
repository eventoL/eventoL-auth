'use strict';

const facebookStrategy = require('passport-facebook').Strategy;

function facebookGetEmail(profile) {
    return profile._json.email;
}

function facebookUserFormater(profile) {
    const user = {
        email:    facebookGetEmail(profile),
        picture:  profile._json.picture.data.url,
        nickname: profile._json.displayName
    };

    if (profile._json.first_name) {
        user.givenName = profile._json.first_name;
    }

    if (profile._json.last_name) {
        user.familyName = profile._json.last_name;
    }

    return user;
}

module.exports = {
    strategy: facebookStrategy,
    getEmail: facebookGetEmail,
    format:   facebookUserFormater,
    type:     'oauth2'
};
