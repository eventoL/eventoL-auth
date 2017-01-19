'use strict';

const request = require('request-promise');

function requestWithQueryString(options, apiKeyPath, apiKey) {
    if (apiKeyPath) {
        options.qs = {
            [apiKeyPath]: apiKey
        };
    }
    return request(options);
}

function addConsumer(kongUrl, username, id, apiKeyPath, apiKey) {
    return requestWithQueryString({
        method: 'POST',
        uri:    `${kongUrl}/consumers`,
        body:   {
            custom_id: id,
            username
        },
        json: true
    }, apiKeyPath, apiKey);
}

function addJWTCredentials(kongUrl, username, id, secret, apiKeyPath, apiKey) {
    return requestWithQueryString({
        method: 'POST',
        uri:    `${kongUrl}/consumers/${username}/jwt`,
        body:   {
            key: id,
            secret
        },
        json: true
    }, apiKeyPath, apiKey);
}

function deleteConsumer(kongUrl, username, apiKeyPath, apiKey) {
    return requestWithQueryString({
        method: 'DELETE',
        uri:    `${kongUrl}/consumers/${username}`
    }, apiKeyPath, apiKey);
}

module.exports = {
    addConsumer,
    deleteConsumer,
    addJWTCredentials
};
