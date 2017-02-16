'use strict';

const JWT = require('../JWT');

function decorator() {
    this.request(JWT.extract);
}

module.exports = decorator;
