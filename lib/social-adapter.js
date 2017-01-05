'use strict';

const facebookStrategy = require('passport-facebook').Strategy;
const googleStrategy   = require('passport-google-oauth20').Strategy;
const githubStrategy   = require('passport-github').Strategy;
const twitterStrategy  = require('passport-twitter').Strategy;

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
    facebook: {
        strategy: facebookStrategy,
        format:   facebookUserFormater,
        getEmail: facebookGetEmail,
        type:     'oauth2'
    },
    google: {
        strategy: googleStrategy,
        format:   googleUserFormater,
        getEmail: googleGetEmail,
        type:     'oauth2'
    },
    github: {
        strategy: githubStrategy,
        format:   githubUserFormater,
        getEmail: githubGetEmail,
        type:     'oauth2'
    },
    twitter: {
        strategy: twitterStrategy,
        format:   twitterUserFormater,
        getEmail: twitterGetEmail,
        type:     'oauth1'
    }
};
