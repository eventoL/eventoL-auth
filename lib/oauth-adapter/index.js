'use strict';

const facebook   = require('./facebook');
const google     = require('./google');
const github     = require('./github');
const twitter    = require('./twitter');
const ldapoauth2 = require('./ldap-oauth2');

module.exports = {
    facebook,
    google,
    github,
    twitter,
    'ldap-oauth2': ldapoauth2
};
