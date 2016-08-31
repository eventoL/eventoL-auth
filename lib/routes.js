'use strict';

const authRouter = require('express').Router();
const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy;
const jwtExtract = require('passport-jwt').ExtractJwt;
const authManagerBuilder = require('./authManager');
const authManager = authManagerBuilder();
const config = require('./config');

passport.use(new jwtStrategy({
    jwtFromRequest: jwtExtract.fromAuthHeaderWithScheme('Bearer'),
    secretOrKey: config.jwt.secret
}, (payload, done) => {
    authManager
        .findById(payload._doc._id)
        .then((user) => {
            return (user !== null && user !== undefined) ? done(null, user) : done(false, null);
        })
        .catch(done);
}));

passport.use('jwtNoExpiration', new jwtStrategy({
    jwtFromRequest: jwtExtract.fromAuthHeaderWithScheme('Bearer'),
    secretOrKey: config.jwt.secret,
    ignoreExpiration: true
}, (payload, done) => {
    authManager
        .findById(payload._doc._id)
        .then((user) => {
            return (user !== null && user !== undefined) ? done(null, user) : done(false, null);
        })
        .catch(done);
}));

authManager.availableProviders.forEach((provider) => {
    authRouter.post(`/auth/${provider}/token`, (req, res) => {
        authManager
            .validateSocialToken(provider, req, res)
            .then((profile) => authManager.authenticate(profile, provider))
            .then((user) => Promise.all([authManager.sign(user),
                authManager.createRefreshToken(user)]))
            .then(([accessToken, refreshToken]) => res.status(200).json({
                accessToken,
                refreshToken
            }))
            .catch((authError) => res.status(401).json(authError));
    });

    authRouter.post(`/connect/${provider}/token`, passport.authenticate('jwt', {
        session: false
    }), (req, res) => {
        authManager
            .validateSocialToken(provider, req, res)
            .then((profile) => authManager.connect(req.user._id, profile, provider))
            .then((user) => authManager.sign(user))
            .then((accessToken) => res.status(200).json({
                accessToken
            }))
            .catch((error) => res.status(500).json(error));
    });

    authRouter.post(`/unlink/${provider}`, passport.authenticate('jwt', {
        session: false
    }), (req, res) => {
        authManager
            .unlink(req.user._id, provider)
            .then((user) => authManager.sign(user))
            .then((accessToken) => res.status(200).json({
                accessToken
            }))
            .catch((error) => res.status(500).json(error));
    });
});

authRouter.post('/auth/register/mail', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    authManager
        .registerMail(req.user._id, req.body.mail)
        .then((user) => authManager.sign(user))
        .then((accessToken) => res.status(200).json({
            accessToken
        }))
        .catch((error) => res.status(500).json(error));
});

authRouter.post('/auth/refresh/token', passport.authenticate('jwtNoExpiration', {
    session: false
}), (req, res) => {
    authManager
        .refreshToken(req.body.refreshToken, req.user)
        .then(([accessToken, refreshToken]) => res.status(200).json({
            accessToken,
            refreshToken
        }))
        .catch((error) => res.status(500).json(error));
});

authRouter.post('/auth/revoke/token', passport.authenticate('jwt', {
    session: false
}), (req, res) => {
    authManager
        .revokeToken(req.body.refreshToken, req.user)
        .then(() => res.status(200).send())
        .catch((error) => res.status(500).json(error));
});

module.exports = authRouter;
