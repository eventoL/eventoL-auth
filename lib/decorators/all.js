'use strict';

const extractJWT = require('../jwt-utils').extractJWT;

function decorator() {
    this.request(extractJWT);
}

module.exports = decorator;
