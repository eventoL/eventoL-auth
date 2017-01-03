'use strict';

const passport = require('passport');

function socialLogin(req, res) {
    console.log(req.swagger.params);
// const {id, provider} = req.params;
// initializePassport(`${provider}|${id}`, '584904718325788', '1b5a37ce3497430955717ac8dd4ffe05'
//     , `http://localhost:3000/app/${id}/${provider}/callback`, ['id', 'displayName', 'photos', 'email']);
// passport.authenticate(`${provider}|${id}`, {
//     session: false
// })(req, res, next);
}

function callback(req, res) {

}

module.exports = {
    socialLogin,
    callback
};
