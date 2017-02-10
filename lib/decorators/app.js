'use strict';

const crypto          = require('crypto');
const OauthConnection = require('../models').OauthConnection;
const keyBy           = require('lodash/fp/keyBy');
const get             = require('lodash/fp/get');
const validate        = require('../validate');

function oauthConnectionHasAttribute(databaseConnection, userConnection) {
    return userConnection.attributes.every((attribute) => {
        return databaseConnection.attributes.some((databaseAttribute) => databaseAttribute.providerName === attribute);
    });
}

function oauthConnectionHasPermission(databaseConnection, userConnection) {
    return userConnection.permissions.every((permission) => {
        return databaseConnection.permissions.some((databasePermission) => databasePermission.providerName === permission);
    });
}

function validateOauthConnection(databaseConnection, userConnection) {
    validate(userConnection.attributes === null || typeof userConnection.attributes === 'undefined',
        'Missing attributes.', 500);
    validate(!oauthConnectionHasAttribute(databaseConnection, userConnection),
        `Invalid ${userConnection.type} connection attributes.`, 500);
    validate(userConnection.permissions === null || typeof userConnection.permissions === 'undefined',
        'Missing permissions.', 500);
    validate(!oauthConnectionHasPermission(databaseConnection, userConnection),
        `Invalid ${userConnection.type} connection permissions.`, 500);
}

function validateOauthConnections(userConnections) {
    return OauthConnection
        .find().exec()
        .then(keyBy(get('_id')))
        .then((databaseConnections) => {
            const promise = new Promise((resolve) => resolve());
            return userConnections
                .filter((userConnection) => databaseConnections.hasOwnProperty(userConnection.type))
                .reduce((promise, userConnection) => {
                    return promise.then(() => validateOauthConnection(databaseConnections[userConnection.type],
                        userConnection));
                }, promise);
        });
}

function appDecorator(controller) {
    controller.request('post', function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            request.body.owner = request.user.profile.id;
        }

        if (request.body.clientSecret === null || typeof request.body.clientSecret === 'undefined') {
            request.body.clientSecret = crypto.randomBytes(32).toString('hex');
        }

        validateOauthConnections(request.body.oauthConnections)
            .then(next)
            .catch((error) => response.status(error.status).json({
                message: error.message
            }));
    });

    controller.request('put', function(request, response, next) {
        validateOauthConnections(request.body.oauthConnections)
            .then(next)
            .catch((error) => response.status(error.status).json({
                message: error.message
            }));
    });

    controller.query(function(request, response, next) {
        if (!request.user.profile.roles.includes('admin')) {
            request.baucis.query.where('owner').equals(request.user.profile.id);
        }

        next();
    });
}

module.exports = appDecorator;
