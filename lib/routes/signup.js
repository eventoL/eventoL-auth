'use strict';

const User       = require('../models').User;
const issueToken = require('../issue-token');

function signUp(req, res) {
    return User
        .create({
            username: req.swagger.params.user.value.username,
            password: req.swagger.params.user.value.password,
            email:    req.swagger.params.user.value.email,
            roles:    ['user']
        })
        .then(issueToken)
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
    signUp
};
