'use strict';

const User = require('../models').User;

function signUp(req, res, next) {
    return User
        .create({
            username: req.swagger.params.user.value.username,
            password: req.swagger.params.user.value.password,
            email:    req.swagger.params.user.value.email,
            roles:    ['user']
        })
        .then((user) => user.issueToken())
        .then((jwt) => res.status(200).send({
            jwt
        }))
        .catch(next);
}

module.exports = {
    signUp
};
