'use strict';

const request = require('request-promise');

function addConsumer(kongUrl, username, id) {
    return request({
        method: 'POST',
        uri:    `${kongUrl}/consumers`,
        body:   {
            custom_id: id,
            username
        },
        json: true
    });
}

function addJWTCredentials(kongUrl, username, id, secret) {
    return request({
        method: 'POST',
        uri:    `${kongUrl}/consumers/${username}/jwt`,
        body:   {
            key: id,
            secret
        },
        json: true
    });
}

function deleteConsumer(kongUrl, username) {
    return request({
        method: 'DELETE',
        uri:    `${kongUrl}/consumers/${username}`
    });
}

module.exports = {
    addConsumer,
    deleteConsumer,
    addJWTCredentials
};
