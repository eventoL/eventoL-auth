'use strict';

require('should');
const githubAdapter = require('../../lib/oauth-adapter').github;

describe('Github oauth adapter', function() {
    it('should return the email when calling getEmail', function() {
        githubAdapter.getEmail({
            _json: {
                email: 'unmail@gmail.com'
            }
        }).should.be.equal('unmail@gmail.com');
    });

    it('should return the basic info when calling format', function() {
        const profile = githubAdapter.format({
            _json: {
                email:      'unmail@gmail.com',
                avatar_url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
                login:      'Ricardito'
            }
        });

        profile.email.should.be.equal('unmail@gmail.com');
        profile.picture.should.be.equal('http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg');
        profile.nickname.should.be.equal('Ricardito');
    });
});
