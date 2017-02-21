'use strict';

require('should');
const ldapAdapter = require('../../lib/oauth-adapter')['ldap-oauth2'];

describe('LDAP oauth adapter', function() {
    it('should return the email when calling getEmail', function() {
        ldapAdapter.getEmail({
            email: 'unmail@gmail.com'
        }).should.be.equal('unmail@gmail.com');
    });

    it('should return the basic info when calling format', function() {
        const profile = ldapAdapter.format({
            email:       'unmail@gmail.com',
            displayName: 'Ricardito',
            familyName:  'Fort',
            givenName:   'Ricardo'
        });

        profile.email.should.be.equal('unmail@gmail.com');
        profile.nickname.should.be.equal('Ricardito');
        profile.familyName.should.be.equal('Fort');
        profile.givenName.should.be.equal('Ricardo');
    });
});
