'use strict';

const githubStrategy = require('passport-github').Strategy;

function githubGetEmail(profile) {
    return profile._json.email;
}

function githubUserFormater(profile) {
    return {
        email:    githubGetEmail(profile),
        picture:  profile._json.avatar_url,
        nickname: profile._json.login
    };
}

module.exports = {
    Strategy: githubStrategy,
    getEmail: githubGetEmail,
    format:   githubUserFormater,
    type:     'oauth2'
};
