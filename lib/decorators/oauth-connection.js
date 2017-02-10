'use strict';

const validateAdmin = require('./validate-admin');

function decorator(controller) {
    controller.request(validateAdmin);
}

module.exports = decorator;
