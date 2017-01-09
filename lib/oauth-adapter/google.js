'use strict';

const googleStrategy = require('passport-google-oauth20').Strategy;

function googleGetEmail(profile) {
    return profile._json.emails[0].value;
}

function googleUserFormater(profile) {
    const user = {
        email:    googleGetEmail(profile),
        picture:  profile._json.image.url,
        nickname: profile._json.displayName
    };

    if (profile._json.name.given_name) {
        user.givenName = profile._json.given_name;
    }

    if (profile._json.name.family_name) {
        user.familyName = profile._json.family_name;
    }

    return user;
}

module.exports = {
    Strategy: googleStrategy,
    getEmail: googleGetEmail,
    format:   googleUserFormater,
    type:     'oauth2'
};
