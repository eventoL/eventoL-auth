'use strict';

const facebookStrategy = require('passport-token-facebook');
const googleStrategy = require('passport-google-plus-token');
const githubStrategy = require('passport-github-token');
const twitterStrategy = require('passport-twitter-token');

const authenticateStrategies = {
    facebook: 'token-facebook',
    google: 'google-plus-token',
    github: 'github-token',
    twitter: 'twitter-token'
};

function buildUser(provider, profile) {
    const user = {
        id: profile.id
    };

    if (profile.emails !== undefined && profile.emails.length !== 0 &&
        profile.emails[0].value.length > 0) {
        user.mail = profile.emails[0].value;
    }

    if (profile._json.avatar_url !== undefined) {
        user.profilePicture = profile._json.avatar_url;
    }

    if (profile.username !== undefined) {
        user.username = profile.username;
    }

    if (profile.displayName !== undefined) {
        user.fullName = profile.displayName;
    }

    switch (provider) {
        case 'facebook':
            if (profile._json.picture !== undefined &&
                profile._json.picture.data !== undefined) {
                user.profilePicture = profile._json.picture.data.url;
            }
            break;
        case 'twitter':
            if (profile._json.profile_image_url !== undefined) {
                user.profilePicture = profile._json.profile_image_url;
            }
            break;
        case 'google':
            if (profile._json.image !== undefined &&
                profile._json.image.url !== undefined) {
                user.profilePicture = profile._json.image.url;
            }
            break;
        case 'github':
            if (profile._json.avatar_url !== undefined) {
                user.profilePicture = profile._json.avatar_url;
            }
            break;
        default:
            break;
    }

    return user;
}

function passportBuilder(config) {
    const passport = require('passport');

    passport.use(new facebookStrategy({
        clientID: '-',
        clientSecret: '-',
        enableProof: false,
        profileFields: ['id', 'displayName', 'photos', 'email', 'first_name', 'middle_name', 'last_name']
    }, (accessToken, refreshToken, profile, done) => {
        done(null, buildUser('facebook', profile));
    }));

    passport.use(new googleStrategy({
        clientID: '-',
        clientSecret: '-',
        enableProof: false
    }, (accessToken, refreshToken, profile, done) => {
        done(null, buildUser('google', profile));
    }));

    passport.use(new githubStrategy({
        clientID: '-',
        clientSecret: '-',
        enableProof: false
    }, (accessToken, refreshToken, profile, done) => {
        done(null, buildUser('github', profile));
    }));

    passport.use(new twitterStrategy({
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret
    }, (accessToken, refreshToken, profile, done) => {
        done(null, buildUser('twitter', profile));
    }));

    return passport;
}

module.exports = {
    passportBuilder,
    authenticateStrategies
};
