'use strict';

const User     = require('../models').User;
const signUser = require('../sign-user');

function logIn(req, res) {
    return User
        .login(req.swagger.params.credentials.value.username, req.swagger.params.credentials.value.password)
        .then(signUser)
        .then((jwt) => res.status(200).send({
            jwt
        }))
        .catch((error) => {
            if (error.statusCode !== null && typeof error.statusCode !== 'undefined') {
                return res.status(error.statusCode).json({
                    message: error.message
                });
            }

            return res.status(500).json(error);
        });
}

module.exports = {
    logIn
};
