'use strict';

function validate(condition, message, statusCode) {
    if (condition) {
        const error = new Error(message);

        if (statusCode !== null && typeof statusCode !== 'undefined') {
            error.status = statusCode;
        }

        throw error;
    }
}

module.exports = validate;
