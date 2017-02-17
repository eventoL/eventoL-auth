'use strict';

const kong     = require('../kong');
const logger   = require('../logger');
const validate = require('./validate');
const JWT      = require('./JWT');

function create(context, application, user) {
    return kong.addConsumer(context.kongUrl, user._id, context.kongApiKeyPath, context.kongApiKey)
        .then((res) => {
            logger.info('Consumer created: ', res);
            return kong.addJWTCredentials(context.kongUrl, user._id,
                application.clientSecret + user._id.toString(), context.kongApiKeyPath, context.kongApiKey);
        })
        .then(() => user)
        .catch(logger.error);
}

function update(context, application, user) {
    return user;
}

function remove(context, application, user) {
    return kong.deleteConsumer(context.kongUrl, user._id, context.kongApiKeyPath, context.kongApiKey)
        .then(() => user);
}

function verifyJWT(jwt, clientSecret) {
    return JWT
        .decode(jwt)
        .then((user) => {
            validate(user.profile.id === null || typeof user.profile.id === 'undefined', 'Invalid JWT');
            return JWT.verify(jwt, clientSecret + user.profile.id);
        });
}

module.exports = {
    create,
    update,
    remove,
    verifyJWT,
    issueToken: JWT.issue
};
