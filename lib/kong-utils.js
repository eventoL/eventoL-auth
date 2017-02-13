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

function addConsumer(kongUrl, id, apiKeyPath, apiKey) {
    return requestWithQueryString({
        method: 'POST',
        uri:    `${kongUrl}/consumers`,
        body:   {
            username: id
        },
        json: true
    }, apiKeyPath, apiKey);
}

function addJWTCredentials(kongUrl, id, secret, apiKeyPath, apiKey) {
    return requestWithQueryString({
        method: 'POST',
        uri:    `${kongUrl}/consumers/${id}/jwt`,
        body:   {
            key: id,
            secret
        },
        json: true
    }, apiKeyPath, apiKey);
}

function deleteConsumer(kongUrl, id, apiKeyPath, apiKey) {
    return requestWithQueryString({
        method: 'DELETE',
        uri:    `${kongUrl}/consumers/${id}`
    }, apiKeyPath, apiKey);
}

module.exports = {
    addConsumer,
    deleteConsumer,
    addJWTCredentials
};
