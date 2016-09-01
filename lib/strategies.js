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

function buildUser(profile) {
    const user = {
        id: profile.id
    };

    if (profile.emails !== undefined && profile.emails[0] !== undefined &&
        profile.emails[0].value.length > 0) {
        user.mail = profile.emails[0].value;
    }

    return user;
}

function passportBuilder(config) {
    const passport = require('passport');

    passport.use(new facebookStrategy({
        clientID: '-',
        clientSecret: '-',
        enableProof: false
    }, (accessToken, refreshToken, profile, done) => done(null, buildUser(profile))));

    passport.use(new googleStrategy({
        clientID: '-',
        clientSecret: '-',
        enableProof: false
    }, (accessToken, refreshToken, profile, done) => done(null, buildUser(profile))));

    passport.use(new githubStrategy({
        clientID: '-',
        clientSecret: '-',
        enableProof: false
    }, (accessToken, refreshToken, profile, done) => done(null, buildUser(profile))));

    passport.use(new twitterStrategy({
        consumerKey: config.twitter.consumerKey,
        consumerSecret: config.twitter.consumerSecret
    }, (accessToken, refreshToken, profile, done) => done(null, buildUser(profile))));

    return passport;
}

module.exports = {
    passportBuilder,
    authenticateStrategies
};
