'use strict';

function validate(condition, message, statusCode) {
    if (condition) {
        const error = new Error(message);
        error.status = statusCode;
        throw error;
    }
}

module.exports = validate;
