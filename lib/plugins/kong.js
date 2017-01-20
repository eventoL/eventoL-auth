'use strict';

const kongUtils    = require('../kong-utils');
const logger       = require('../logger');
const jsonwebtoken = require('jsonwebtoken');

function create(context, application, user) {
    return kongUtils.addConsumer(context.kongUrl, user.nickname, user._id, context.kongApiKeyPath, context.kongApiKey)
        .then((res) => {
            logger.info('Consumer created: ', res);
            return kongUtils.addJWTCredentials(context.kongUrl, user.nickname,
                user._id, application.clientSecret + user._id.toString(),
                context.kongApiKeyPath, context.kongApiKey);
        })
        .then(() => user)
        .catch(logger.error);
}

function update(context, application, user) {
    return user;
}

function remove(context, application, user) {
    return kongUtils.deleteConsumer(context.kongUrl, user.nickname, context.kongApiKeyPath, context.kongApiKey)
        .then(() => user);
}

function issueToken(profile, clientSecret, jwtOptions) {
    return jsonwebtoken.sign({
        profile
    }, clientSecret + profile.id.toString(), jwtOptions);
}

function verifyJWT(jwt, clientSecret) {
    return new Promise((resolve, reject) => {
        const profile = jsonwebtoken.decode(jwt).profile;

        if (profile === null || typeof profile === 'undefined') {
            reject(new Error('Invalid JWT'));
        }

        if (profile.id === null || typeof profile.id === 'undefined') {
            reject(new Error('Invalid JWT'));
        }

        jsonwebtoken.verify(jwt, clientSecret + profile.id, (error, user) => {
            if (error) {
                return reject(error);
            }

            return resolve(user);
        });
    });
}

module.exports = {
    create,
    update,
    remove,
    issueToken,
    verifyJWT
};
