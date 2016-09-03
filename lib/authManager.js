'use strict';
const {passportBuilder, authenticateStrategies} = require('./strategies');
const jwt = require('jsonwebtoken');

function AuthManager(passport, userModel, refreshTokenModel, availableProviders, jwtConfig) {
    this.passport = passport;
    this.userModel = userModel;
    this.refreshTokenModel = refreshTokenModel;
    this.availableProviders = availableProviders;
    this.jwtConfig = jwtConfig;
}

AuthManager.prototype.connectUserByMail = function connectUserByMail(profile, provider) {
    if (profile.mail === undefined || profile.mail === null) {
        return undefined;
    }

    return this.userModel
        .findByMail(profile.mail)
        .then((userByMail) => {
            return this.userModel.connect(userByMail, provider, profile);
        });
};

AuthManager.prototype.validateSocialToken = function validateSocialToken(provider, req, res) {
    return new Promise((resolve, reject) => {
        this.passport.authenticate(authenticateStrategies[provider], (error, profile) => {
            return (error !== undefined && error !== null) ? reject(error) : resolve(profile);
        })(req, res);
    });
};

AuthManager.prototype.authenticate = function authenticate(profile, provider) {
    return this.userModel
        .findByProfileId(provider, profile.id)
        .then((user) => {
            if (user === undefined || user === null) {
                return this.connectUserByMail(profile, provider);
            }
            return user;
        })
        .then((user) => {
            if (user === undefined || user === null) {
                return this.userModel.createUser(provider, profile);
            }
            return user;
        });
};

AuthManager.prototype.registerMail = function registerMail(id, mail) {
    return this.userModel
        .registerMail(id, mail)
        .then((user) => {
            if (user._id !== id) {
                return this.refreshTokenModel
                    .reasignToken(id, user._id)
                    .then(() => user);
            }

            return user;
        });
};

AuthManager.prototype.connect = function connect(id, profile, provider) {
    return this.userModel.connect(id, provider, profile);
};

AuthManager.prototype.sign = function sign(user) {
    return jwt.sign(user, this.jwtConfig.secret, {
        expiresIn: this.jwtConfig.expires
    });
};

AuthManager.prototype.findById = function findById(id) {
    return this.userModel.findById(id);
};

AuthManager.prototype.unlink = function unlink(id, provider) {
    return this.userModel.unlink(id, provider);
};

AuthManager.prototype.createRefreshToken = function createRefreshToken(user) {
    return this.refreshTokenModel
        .createToken(user._id)
        .then((tokenDocument) => tokenDocument.token);
};

AuthManager.prototype.revokeToken = function revokeToken(token, user) {
    return this.refreshTokenModel
        .validateToken(token, user._id)
        .then(() => this.refreshTokenModel.removeToken(token));
};

AuthManager.prototype.refreshToken = function refreshToken(token, user) {
    return this.refreshTokenModel
        .validateToken(token, user._id)
        .then(() => Promise.all([
            this.sign(user),
            this.createRefreshToken(user),
            this.revokeToken(token, user)
        ]));
};

function buildAuthManager(config) {
    const passport = passportBuilder({
        twitter: config.twitter
    });
    const modelsPath = config.modelsPath || './models';
    const {userModel, refreshTokenModel} = require(modelsPath)(config.models);
    const availableProviders = Object.keys(authenticateStrategies);

    return new AuthManager(passport, userModel, refreshTokenModel, availableProviders, config.jwt);
}

module.exports = buildAuthManager;
