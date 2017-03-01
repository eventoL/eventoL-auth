'use strict';

const AppUser = require('../../lib/models/app-user');
const sinon   = require('sinon');
require('sinon-as-promised');
require('sinon-mongoose');

const mongoose    = require('mongoose');
const AppUserMock = sinon.mock(AppUser);
const linkedUser  = new AppUser({
    email:      'ric@gmail.com',
    picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
    nickname:   'Ricardito',
    app:        '586eccfe99a39c001776f81a',
    _id:        '58add06ab4a022439fe9ab3c',
    identities: [{
        userId:      '21312321321asdasdsads231231223',
        isSocial:    true,
        profileData: {
            picture: {
                data: {
                    url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                }
            },
            id: '21312321321asdasdsads231231223'
        },
        provider:   'google',
        connection: 'google'
    }],
    emailVerified: false,
    blocked:       false,
    roles:         []
});

linkedUser.link = sinon.stub().returns(linkedUser);

AppUserMock
    .expects('findOne')
    .withArgs({
        app:   mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email: 'unmail@gmail.com'
    })
    .resolves(null);

AppUserMock
    .expects('findOne')
    .withArgs({
        app:   mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email: 'miguel@gmail.com'
    })
    .resolves(null);

AppUserMock
    .expects('findOne')
    .withArgs({
        app:   mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email: 'ricardo@gmail.com'
    })
    .twice()
    .resolves(null);

AppUserMock
    .expects('findOne')
    .withArgs({
        app:   mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email: 'ricardito@gmail.com'
    })
    .resolves(new AppUser({
        app:         mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email:       'ricardito@gmail.com',
        appMetadata: {},
        blocked:     true,
        nickname:    'Ricardo',
        picture:     'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
    }));

AppUserMock
    .expects('findOne')
    .withArgs({
        app:   mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email: 'ricky@gmail.com'
    })
    .resolves(new AppUser({
        email:      'ricky@gmail.com',
        picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
        nickname:   'Ricardito',
        app:        '586eccfe99a39c001776f81a',
        _id:        '58add06ab4a022439fe9ab3c',
        identities: [{
            userId:      '21312321321asdasdsads231231223',
            isSocial:    true,
            profileData: {
                picture: {
                    data: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    }
                },
                id: '21312321321asdasdsads231231223'
            },
            provider:   'facebook',
            connection: 'facebook'
        }],
        emailVerified: false,
        blocked:       false,
        roles:         []
    }));

AppUserMock
    .expects('findOne')
    .withArgs({
        app:   mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        email: 'ric@gmail.com'
    })
    .resolves(linkedUser);

AppUserMock
    .expects('findOne')
    .withArgs({
        app:        mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        identities: {
            $elemMatch: {
                userId:     '21312321321asdasdsads231231223',
                connection: 'facebook',
                provider:   'facebook'
            }
        }
    })
    .resolves(new AppUser({
        email:      'ricky@gmail.com',
        picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
        nickname:   'Ricardito',
        app:        '586eccfe99a39c001776f81a',
        _id:        '58add06ab4a022439fe9ab3c',
        identities: [{
            userId:      '21312321321asdasdsads231231223',
            isSocial:    true,
            profileData: {
                picture: {
                    data: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    }
                },
                id: '21312321321asdasdsads231231223'
            },
            provider:   'facebook',
            connection: 'facebook'
        }],
        emailVerified: false,
        blocked:       false,
        roles:         []
    }));

AppUserMock
    .expects('findOne')
    .withArgs({
        app:        mongoose.Types.ObjectId('586eccfe99a39c001776f81a'),
        identities: {
            $elemMatch: {
                userId:     '21312321321asdasdsads231231224',
                connection: 'facebook',
                provider:   'facebook'
            }
        }
    })
    .resolves(null);

AppUserMock
    .expects('findById')
    .withArgs('58add06ab4a022439fe9ab3c')
    .twice()
    .resolves(null);

AppUserMock
    .expects('findById')
    .withArgs('58add06ab4a022439fe9ab3d')
    .resolves(new AppUser({
        email:      'ricky@gmail.com',
        picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
        nickname:   'Ricardito',
        app:        '586eccfe99a39c001776f81a',
        _id:        '58add06ab4a022439fe9ab3c',
        identities: [{
            userId:      '21312321321asdasdsads231231223',
            isSocial:    true,
            profileData: {
                picture: {
                    data: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    }
                },
                id: '21312321321asdasdsads231231223'
            },
            provider:   'facebook',
            connection: 'facebook'
        }],
        emailVerified: false,
        blocked:       false,
        roles:         []
    }));

AppUserMock
    .expects('findById')
    .withArgs('58add06ab4a022439fe9ab3e')
    .resolves(linkedUser);


AppUser.create = function create(obj) {
    return new AppUser(obj);
};

module.exports = {
    AppUserMock,
    AppUser,
    linkedUser
};
