'use strict';

require('should');
const googleAdapter = require('../../lib/oauth-adapter').google;

describe('Google oauth adapter', function() {
    it('should return the email when calling getEmail', function() {
        googleAdapter.getEmail({
            _json: {
                emails: [{
                    value: 'unmail@gmail.com'
                }]
            }
        }).should.be.equal('unmail@gmail.com');
    });

    it('should return the basic info when calling format', function() {
        const profile = googleAdapter.format({
            _json: {
                emails: [{
                    value: 'unmail@gmail.com'
                }],
                image: {
                    url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                },
                displayName: 'Ricardito'
            }
        });

        profile.email.should.be.equal('unmail@gmail.com');
        profile.picture.should.be.equal('http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg');
        profile.nickname.should.be.equal('Ricardito');
    });

    it('should return the basic info with givenName if given_name is present when calling format', function() {
        const profile = googleAdapter.format({
            _json: {
                emails: [{
                    value: 'unmail@gmail.com'
                }],
                image: {
                    url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                },
                name: {
                    given_name: 'Ricardo'
                },
                displayName: 'Ricardito'
            }
        });

        profile.givenName.should.be.equal('Ricardo');
    });

    it('should return the basic info with familyName if family_name is present when calling format', function() {
        const profile = googleAdapter.format({
            _json: {
                emails: [{
                    value: 'unmail@gmail.com'
                }],
                image: {
                    url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                },
                name: {
                    family_name: 'Fort'
                },
                displayName: 'Ricardito'
            }
        });

        profile.familyName.should.be.equal('Fort');
    });
});
