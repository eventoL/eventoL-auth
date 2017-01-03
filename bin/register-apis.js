'use strict';

const request = require('request-promise');

request(
    {
        method: 'POST',
        uri:    'http://localhost:8001' + '/apis/',
        body:   {
            upstream_url:       'http://api:3000',
            name:               'auth',
            request_path:       '/',
            strip_request_path: true
        },
        json: true
    })
    .then(() => request({
        method: 'POST',
        uri:    'http://localhost:8001' + '/apis/',
        body:   {
            upstream_url:       'http://api:3000',
            name:               'users',
            request_path:       '/api/signup',
            strip_request_path: false
        },
        json: true
    }))
    .then(() => request({
        method: 'POST',
        uri:    'http://localhost:8001' + '/apis/',
        body:   {
            upstream_url:       'http://api:3000',
            name:               'login',
            request_path:       '/api/login',
            strip_request_path: false
        },
        json: true
    }))
    .then(() => request({
        method: 'POST',
        uri:    'http://localhost:8001' + '/apis/' + 'auth' + '/plugins',
        body:   {
            name:   'jwt',
            config: {
                uri_param_names:  'jwt',
                claims_to_verify: 'exp, nbf',
                key_claim_name:   'iss',
                secret_is_base64: false
            }
        },
        json: true
    }))
    .catch(console.log);
