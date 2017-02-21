'use strict';

require('should');
const facebookAdapter = require('../../lib/oauth-adapter').facebook;

describe('Facebook oauth adapter', function() {
    it('should return the email when calling getEmail', function() {
        facebookAdapter.getEmail({
            _json: {
                email: 'unmail@gmail.com'
            }
        }).should.be.equal('unmail@gmail.com');
    });

    it('should return the basic info when calling format', function() {
        const profile = facebookAdapter.format({
            _json: {
                email:   'unmail@gmail.com',
                picture: {
                    data: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    }
                }
            },
            displayName: 'Ricardito'
        });

        profile.email.should.be.equal('unmail@gmail.com');
        profile.picture.should.be.equal('http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg');
        profile.nickname.should.be.equal('Ricardito');
    });

    it('should return the basic info with givenName if first_name is present when calling format', function() {
        const profile = facebookAdapter.format({
            _json: {
                email:   'unmail@gmail.com',
                picture: {
                    data: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    }
                },
                first_name: 'Ricardo'
            },
            displayName: 'Ricardito'
        });

        profile.givenName.should.be.equal('Ricardo');
    });

    it('should return the basic info with familyName if last_name is present when calling format', function() {
        const profile = facebookAdapter.format({
            _json: {
                email:   'unmail@gmail.com',
                picture: {
                    data: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    }
                },
                last_name: 'Fort'
            },
            displayName: 'Ricardito'
        });

        profile.familyName.should.be.equal('Fort');
    });
});
