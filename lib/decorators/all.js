'use strict';

const extractJWT = require('../extract-jwt').extractJWT;

function decorator() {
    this.request(extractJWT);
}

module.exports = decorator;
