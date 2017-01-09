'use strict';

const twitterStrategy = require('passport-twitter').Strategy;

function twitterGetEmail(profile) {
    return profile._json.email;
}

function twitterUserFormater(profile) {
    return {
        email:    twitterGetEmail(profile),
        picture:  profile._json.profile_image_url_https,
        nickname: profile._json.screen_name
    };
}

module.exports = {
    Strategy: twitterStrategy,
    getEmail: twitterGetEmail,
    format:   twitterUserFormater,
    type:     'oauth1'
};
