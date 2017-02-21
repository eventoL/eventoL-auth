'use strict';

require('should');
const twitterAdapter = require('../../lib/oauth-adapter').twitter;

describe('Twitter oauth adapter', function() {
    it('should return the email when calling getEmail', function() {
        twitterAdapter.getEmail({
            _json: {
                email: 'unmail@gmail.com'
            }
        }).should.be.equal('unmail@gmail.com');
    });

    it('should return the basic info when calling format', function() {
        const profile = twitterAdapter.format({
            _json: {
                email:                   'unmail@gmail.com',
                profile_image_url_https: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
                screen_name:             'Ricardito'
            }
        });

        profile.email.should.be.equal('unmail@gmail.com');
        profile.picture.should.be.equal('http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg');
        profile.nickname.should.be.equal('Ricardito');
    });
});
