'use strict';

const User = require('../models').User;

function logIn(req, res, next) {
    return User
        .login(req.swagger.params.credentials.value.username, req.swagger.params.credentials.value.password)
        .then((user) => user.issueToken())
        .then((jwt) => res.status(200).send({
            jwt
        }))
        .catch(next);
}

module.exports = {
    logIn
};
