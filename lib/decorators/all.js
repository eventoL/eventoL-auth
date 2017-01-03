'use strict';

const extractJwt = require('./extract-jwt');

function decorator() {
    this.request(extractJwt);
}

module.exports = decorator;
