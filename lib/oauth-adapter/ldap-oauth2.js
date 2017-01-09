'use strict';

const Oauth2Strategy = require('passport-oauth2').Strategy;
const util           = require('util');

function LdapOauth2Strategy(options, callback) {
    this.profileUrl = options.profileURL;
    Reflect.apply(Oauth2Strategy, this, [options, callback]);
}

util.inherits(LdapOauth2Strategy, Oauth2Strategy);

LdapOauth2Strategy.prototype.userProfile = function(accessToken, done) {
    this._oauth2.get(this.profileUrl, accessToken, (err, body) => {
        if (err) {
            return done(new Error('failed to fetch user profile', err));
        }

        try {
            const json = JSON.parse(body);

            done(null, {
                provider:    this.name,
                id:          json.id,
                displayName: json.displayName,
                email:       json.email,
                familyName:  json.familyName,
                givenName:   json.givenName,
                memberOf:    json.memberOf,
                _raw:        body,
                _json:       json
            });
        } catch (error) {
            done(error);
        }
    });
};

function ldapGetEmail(profile) {
    return profile.email;
}

function ldapUserFormater(profile) {
    return {
        email:      ldapGetEmail(profile),
        nickname:   profile.displayName,
        familyName: profile.familyName,
        givenName:  profile.givenName
    };
}

module.exports = {
    Strategy: LdapOauth2Strategy,
    getEmail: ldapGetEmail,
    format:   ldapUserFormater,
    type:     'ldap-oauth2'
};
