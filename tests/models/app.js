'use strict';

const should     = require('should');
const proxyquire = require('proxyquire');
const sinon      = require('sinon');

const kongPlugin = require('../../lib/plugins').kong;
kongPlugin.issueToken = sinon.spy();
kongPlugin.verifyJWT  = sinon.spy();

const JWT = {
    verify: sinon.spy(),
    issue:  sinon.spy()
};

const AppUser     = require('../mocks/app-user').AppUser;
const AppUserMock = require('../mocks/app-user').AppUserMock;
const linkedUser  = require('../mocks/app-user').linkedUser;

const LinkUser = {
    create: sinon.stub().resolves(linkedUser),
    remove: sinon.stub().resolves()
}

require('sinon-as-promised');
require('sinon-mongoose');

const App = proxyquire('../../lib/models/app', {
    '../JWT':      JWT,
    './app-user':  AppUser,
    './link-user': LinkUser,
    '../plugins':  {
        kong: kongPlugin
    }
});

describe('App Model', function() {
    describe('validate', function() {
        let AppMock;
        beforeEach(function() {
            AppMock = sinon.mock(App);
            AppMock
                .expects('findOne')
                .withArgs({
                    _id: '586eccfe99a39c001776f81a'
                })
                .resolves(null);

            AppMock
                .expects('findOne')
                .withArgs({
                    _id: '586eccfe99a39c001776f81b'
                })
                .resolves({
                    _id:     '586eccfe99a39c001776f81b',
                    name:    'MostazaApp',
                    plugins: [{
                        name:              'kong',
                        issueTokenEnabled: true,
                        context:           {
                            kongUrl:        'http://kong-2:8000/admin',
                            kongApiKeyPath: 'apikey',
                            kongApiKey:     'unakey'
                        }
                    }],
                    owner:              '5873d6b0f1d231001750d7ba',
                    minimalUserEnabled: false,
                    oauthConnections:   [
                        {
                            type:          'google',
                            connection:    'google',
                            signupEnabled: true,
                            appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                            appSecret:     '65asd65sa4d6sa',
                            attributes:    ['emails', 'url'],
                            permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                        },
                        {
                            type:          'github',
                            connection:    'github',
                            appId:         '83077c58faeb3b0f5dd6',
                            signupEnabled: true,
                            appSecret:     '54ass54dsad5s4a65dsa',
                            permissions:   ['user:email'],
                            attributes:    ['email', 'public_repos', 'received_events_url']
                        },
                        {
                            type:        'twitter',
                            connection:  'twitter',
                            appId:       'wn5RhwT1U2QzYzfsvzHd33eGf',
                            appSecret:   '456d4sa654d56sa4d56sa4d',
                            attributes:  ['screen_name', 'friends_count'],
                            permissions: []
                        },
                        {
                            type:             'ldap-oauth2',
                            connection:       'exo_ad',
                            appId:            '1234567890',
                            appSecret:        'asdsadsadsacvd',
                            authorizationUrl: 'http://10.18.12.19:4000/dialog/authorize',
                            tokenUrl:         'http://10.18.12.19:4000/oauth/token',
                            profileUrl:       'http://10.18.12.19:4000/api/profile'
                        }
                    ]
                });
        });

        afterEach(function() {
            AppMock.restore();
        });

        it('should reject when calling with a not existing id', function() {
            return App
                .validate('586eccfe99a39c001776f81a', 'facebook')
                .catch((error) => {
                    error.message.should.be.equal('Application 586eccfe99a39c001776f81a not found.');
                    error.status.should.be.equal(404);
                });
        });

        it('should reject when calling with a not existent connection', function() {
            return App
                .validate('586eccfe99a39c001776f81b', 'facebook')
                .catch((error) => {
                    error.message.should.be.equal('facebook is not available for this app');
                    error.status.should.be.equal(500);
                });
        });

        it('should resolve with the application when the id and connection exists', function() {
            return App
                .validate('586eccfe99a39c001776f81b', 'twitter')
                .then((application) => {
                    application._id.should.be.equal('586eccfe99a39c001776f81b');
                    application.name.should.be.equal('MostazaApp');
                    application.owner.should.be.equal('5873d6b0f1d231001750d7ba');
                    application.minimalUserEnabled.should.be.equal(false);
                    const kongPlugin = application.plugins[0];
                    kongPlugin.name.should.be.equal('kong');
                    kongPlugin.issueTokenEnabled.should.be.equal(true);
                    kongPlugin.context.kongUrl.should.be.equal('http://kong-2:8000/admin');
                    kongPlugin.context.kongApiKeyPath.should.be.equal('apikey');
                    kongPlugin.context.kongApiKey.should.be.equal('unakey');
                });
        });
    });

    describe('fromUser', function() {
        let AppMock;
        beforeEach(function() {
            AppMock = sinon.mock(App);
            AppMock
                .expects('find')
                .withArgs({
                    owner: '586eccfe99a39c001776f81b'
                }, {
                    _id: 1
                })
                .chain('exec')
                .resolves([]);

            AppMock
                .expects('find')
                .withArgs({
                    owner: '586eccfe99a39c001776f81a'
                }, {
                    _id: 1
                })
                .chain('exec')
                .resolves([{
                    _id: '586eccfe99a39c001776f81c'
                }, {
                    _id: '586eccfe99a39c001776f81d'
                }, {
                    _id: '586eccfe99a39c001776f81e'
                }]);
        });

        afterEach(function() {
            AppMock.restore();
        });

        it('should return an empty list if the user hasn\'t got any apps', function() {
            return App
                .fromUser('586eccfe99a39c001776f81b')
                .should.be.fulfilledWith([]);
        });

        it('should return a list of the ids of the apps of the user', function() {
            return App
                .fromUser('586eccfe99a39c001776f81a')
                .should.be.fulfilledWith(['586eccfe99a39c001776f81c', '586eccfe99a39c001776f81d', '586eccfe99a39c001776f81e']);
        });
    });

    describe('issueToken', function() {
        let appWithKongPlugin;
        let appWithoutKongPlugin;
        let appWithMinimalUserEnabled;
        let appWithKongPluginAndMinimalUser;

        beforeEach(function() {
            appWithMinimalUserEnabled = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: true,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithoutKongPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithKongPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithKongPluginAndMinimalUser = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: true,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });
        });

        afterEach(function() {
            JWT.issue.reset();
            kongPlugin.issueToken.reset();
        });

        it('should call JWT.issue with the minimal profile when minimalUserEnabled is enabled', function() {
            appWithMinimalUserEnabled.issueToken({
                _id:   '586eccfe99a39c001776f81c',
                __v:   '434s65d4as654d65sa4d684s53d46sa5',
                email: 'agustinc@gmail.com',
                app:   '586eccfe99a39c001776f81b',
                roles: ['pedro']
            });

            JWT.issue.calledOnce.should.be.true();
            JWT.issue.calledWithExactly({
                id:    '586eccfe99a39c001776f81c',
                app:   '586eccfe99a39c001776f81b',
                roles: ['pedro']
            }, 'secretin', {
                expiresIn: 36000,
                notBefore: '1ms',
                issuer:    '586eccfe99a39c001776f81c'
            }).should.be.true();
        });

        it('should call JWT.issue with the complete profile when minimalUserEnabled is disabled', function() {
            appWithoutKongPlugin.issueToken({
                _id:        '586eccfe99a39c001776f81c',
                __v:        '434s65d4as654d65sa4d684s53d46sa5',
                email:      'agustinc@gmail.com',
                app:        '586eccfe99a39c001776f81b',
                nickname:   'Ricardito',
                givenName:  'Ricardo',
                familyName: 'Fort',
                roles:      ['pedro']
            });

            JWT.issue.calledOnce.should.be.true();
            JWT.issue.calledWithExactly({
                id:         '586eccfe99a39c001776f81c',
                app:        '586eccfe99a39c001776f81b',
                roles:      ['pedro'],
                email:      'agustinc@gmail.com',
                nickname:   'Ricardito',
                givenName:  'Ricardo',
                familyName: 'Fort'
            }, 'secretin', {
                expiresIn: 36000,
                notBefore: '1ms',
                issuer:    '586eccfe99a39c001776f81c'
            }).should.be.true();
        });

        it('should call kong.issueToken with the complete profile when minimalUserEnabled is disabled and the kong plugin is enabled', function() {
            appWithKongPlugin.issueToken({
                _id:        '586eccfe99a39c001776f81c',
                __v:        '434s65d4as654d65sa4d684s53d46sa5',
                email:      'agustinc@gmail.com',
                app:        '586eccfe99a39c001776f81b',
                nickname:   'Ricardito',
                givenName:  'Ricardo',
                familyName: 'Fort',
                roles:      ['pedro']
            });

            kongPlugin.issueToken.calledOnce.should.be.true();
            kongPlugin.issueToken.calledWithExactly({
                id:         '586eccfe99a39c001776f81c',
                app:        '586eccfe99a39c001776f81b',
                roles:      ['pedro'],
                email:      'agustinc@gmail.com',
                nickname:   'Ricardito',
                givenName:  'Ricardo',
                familyName: 'Fort'
            }, 'secretin', {
                expiresIn: 36000,
                notBefore: '1ms',
                issuer:    '586eccfe99a39c001776f81c'
            }).should.be.true();
        });

        it('should call kong.issueToken with the minimal profile when minimalUserEnabled is enabled and the kong plugin is enabled', function() {
            appWithKongPluginAndMinimalUser.issueToken({
                _id:        '586eccfe99a39c001776f81c',
                __v:        '434s65d4as654d65sa4d684s53d46sa5',
                email:      'agustinc@gmail.com',
                app:        '586eccfe99a39c001776f81b',
                nickname:   'Ricardito',
                givenName:  'Ricardo',
                familyName: 'Fort',
                roles:      ['pedro']
            });

            kongPlugin.issueToken.calledOnce.should.be.true();
            kongPlugin.issueToken.calledWithExactly({
                id:    '586eccfe99a39c001776f81c',
                app:   '586eccfe99a39c001776f81b',
                roles: ['pedro']
            }, 'secretin', {
                expiresIn: 36000,
                notBefore: '1ms',
                issuer:    '586eccfe99a39c001776f81c'
            }).should.be.true();
        });
    });

    describe('hasIssueTokenPlugin', function() {
        let appWithKongPlugin;
        let appWithoutKongPlugin;
        let appWithNormalPlugin;

        beforeEach(function() {
            appWithoutKongPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithKongPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithNormalPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:    'plugin',
                    context: {
                        boolean: true
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });
        });

        it('should return false if the app hasn\'t got any plugin', function() {
            appWithoutKongPlugin.hasIssueTokenPlugin().should.be.false();
        });

        it('should return false if the app hasn\'t got any plugin with issueToken', function() {
            appWithNormalPlugin.hasIssueTokenPlugin().should.be.false();
        });

        it('should return false if the app has got any issueToken plugin', function() {
            appWithKongPlugin.hasIssueTokenPlugin().should.be.true();
        });
    });

    describe('getIssueTokenPlugin', function() {
        it('should return the first plugin with issueTokenEnabled', function() {
            const appWithKongPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithKongPlugin.getIssueTokenPlugin().name.should.be.equal('kong');
        });
    });

    describe('verifyJWT', function() {
        let appWithKongPlugin;
        let appWithoutPlugins;
        let appWithNormalPlugin;

        beforeEach(function() {
            appWithoutPlugins = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithKongPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            appWithNormalPlugin = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:    'plugin',
                    context: {
                        boolean: true
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });
        });

        afterEach(function() {
            JWT.verify.reset();
            kongPlugin.verifyJWT.reset();
        });

        it('should call JWT.verify when called in an app without plugins', function() {
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9maWxlIjp7ImlkIjoiNThhNDkyZjZjODI0Mjc3NzRiM2FjZGE2Iiwicm9sZXMiOlsiYWRtaW4iXX0sImlhdCI6MTQ4NzE4MDU4MSwibmJmIjoxNDg3MTgwNTgyLCJleHAiOjE0ODcxOTQ5ODEsImlzcyI6IjU4YTQ5MmY2YzgyNDI3Nzc0YjNhY2RhNiJ9.n9DzELrTV5i0t_4wqqdnRONhNWCxFfGjmG3SXOsrVHY';
            appWithoutPlugins.verifyJWT(jwt);
            JWT.verify.calledOnce.should.be.true();
            JWT.verify.calledWithExactly(jwt, 'secretin').should.be.true();
        });

        it('should call JWT.verify when called in an app without issueToken plugins', function() {
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9maWxlIjp7ImlkIjoiNThhNDkyZjZjODI0Mjc3NzRiM2FjZGE2Iiwicm9sZXMiOlsiYWRtaW4iXX0sImlhdCI6MTQ4NzE4MDU4MSwibmJmIjoxNDg3MTgwNTgyLCJleHAiOjE0ODcxOTQ5ODEsImlzcyI6IjU4YTQ5MmY2YzgyNDI3Nzc0YjNhY2RhNiJ9.n9DzELrTV5i0t_4wqqdnRONhNWCxFfGjmG3SXOsrVHY';
            appWithNormalPlugin.verifyJWT(jwt);
            JWT.verify.calledOnce.should.be.true();
            JWT.verify.calledWithExactly(jwt, 'secretin').should.be.true();
        });

        it('should call kong.verifyJWT when called in an app with issueToken plugins', function() {
            const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9maWxlIjp7ImlkIjoiNThhNDkyZjZjODI0Mjc3NzRiM2FjZGE2Iiwicm9sZXMiOlsiYWRtaW4iXX0sImlhdCI6MTQ4NzE4MDU4MSwibmJmIjoxNDg3MTgwNTgyLCJleHAiOjE0ODcxOTQ5ODEsImlzcyI6IjU4YTQ5MmY2YzgyNDI3Nzc0YjNhY2RhNiJ9.n9DzELrTV5i0t_4wqqdnRONhNWCxFfGjmG3SXOsrVHY';
            appWithKongPlugin.verifyJWT(jwt);
            kongPlugin.verifyJWT.calledOnce.should.be.true();
            kongPlugin.verifyJWT.calledWithExactly(jwt, 'secretin').should.be.true();
        });
    });

    describe('getProfileAttributes', function() {
        it('should return an object with the attributes of the oauth connection', function() {
            const app = new App({
                owner:              '586eccfe99a39c001776f81b',
                name:               'mostaza',
                clientSecret:       'secretin',
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: true,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     '4564654dsadsad',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ],
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                defaultRoles: ['pedro'],
                roles:        [
                    {
                        roleName:        'pedro',
                        roleDescription: 'The pedro role'
                    }
                ]
            });

            const profile = app.getProfileAttributes('google', 'google', {
                emails: [
                    'pedrito@gmail.com',
                    'juancito@gmail.com'
                ],
                fakeAttribute: 42,
                url:           'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
            });

            profile.emails.should.containEql('pedrito@gmail.com').and.containEql('juancito@gmail.com');
            profile.url.should.be.equal('http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg');
            should(profile.fakeAttribute).be.undefined();
        });
    });

    describe('connect', function() {
        let appWithWhiteList;
        let appWithoutWhiteList;

        beforeEach(function() {
            appWithWhiteList = new App({
                _id:     '586eccfe99a39c001776f81a',
                name:    'MostazaApp',
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                whiteList:          ['ricardo@gmail.com'],
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'facebook',
                        connection:    'facebook',
                        appId:         '362471190780643',
                        signupEnabled: true,
                        appSecret:     '478f14a56b4832f004e69dfc9b1ed56b',
                        attributes:    ['id', 'displayName', 'picture', 'emails', 'birthday', 'context', 'gender', 'first_name', 'last_name', 'middle_name'],
                        permissions:   ['public_profile', 'email', 'user_religion_politics', 'user_birthday']
                    },
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: false,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     'cAa76h_CDm5Y6sm8G8neBETV',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ]
            });

            appWithWhiteList.issueToken = sinon.spy();

            appWithoutWhiteList = new App({
                _id:     '586eccfe99a39c001776f81a',
                name:    'MostazaApp',
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'facebook',
                        connection:    'facebook',
                        appId:         '362471190780643',
                        signupEnabled: true,
                        appSecret:     '478f14a56b4832f004e69dfc9b1ed56b',
                        attributes:    ['id', 'displayName', 'picture', 'emails', 'birthday', 'context', 'gender', 'first_name', 'last_name', 'middle_name'],
                        permissions:   ['public_profile', 'email', 'user_religion_politics', 'user_birthday']
                    },
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: false,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     'cAa76h_CDm5Y6sm8G8neBETV',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ]
            });

            appWithoutWhiteList.issueToken = sinon.spy();
            appWithoutWhiteList.link       = sinon.spy();
        });

        it('should return validation error if the connection hasn\'t got signupEnabled', function() {
            return appWithWhiteList.connect('google', 'google', {
                _json: {
                    emails: [{
                        value: 'unmail@gmail.com'
                    }],
                    image: {
                        url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                    },
                    displayName: 'Ricardito'
                }
            }).should.be.rejectedWith(Error, {
                message: 'google is not available for registration in this app',
                status:  404
            });
        });

        it('should return validation error if the application has a whitelist and the email isn\'t in the whitelist', function() {
            return appWithWhiteList.connect('facebook', 'facebook', {
                _json: {
                    email:   'miguel@gmail.com',
                    picture: {
                        data: {
                            url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                        }
                    }
                },
                displayName: 'Ricardito'
            }).should.be.rejectedWith(Error, {
                message: 'The email miguel@gmail.com isn\'t part of the application\'s white list.',
                status:  403
            });
        });

        it('should create the user if it doesn\'t exist and the oauth connection has signupEnabled', function() {
            return appWithoutWhiteList.connect('facebook', 'facebook', {
                _json: {
                    id:      '21312321321asdasdsads231231223',
                    email:   'ricardo@gmail.com',
                    picture: {
                        data: {
                            url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                        }
                    }
                },
                displayName: 'Ricardito'
            }).then(() => {
                appWithoutWhiteList.issueToken.calledOnce.should.be.true();
            });
        });

        it('should create the user if it doesn\'t exist and the application has a whitelist and the user mail is it the whitelist', function() {
            return appWithWhiteList.connect('facebook', 'facebook', {
                _json: {
                    id:      '21312321321asdasdsads231231223',
                    email:   'ricardo@gmail.com',
                    picture: {
                        data: {
                            url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                        }
                    }
                },
                displayName: 'Ricardito'
            }).then(() => {
                appWithWhiteList.issueToken.calledOnce.should.be.true();
            });
        });

        it('should return validation error if the user is blocked', function() {
            return appWithoutWhiteList.connect('facebook', 'facebook', {
                _json: {
                    id:      '21312321321asdasdsads231231223',
                    email:   'ricardito@gmail.com',
                    picture: {
                        data: {
                            url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                        }
                    }
                },
                displayName: 'Ricardito'
            }).should.be.rejectedWith(Error, {
                message: 'The user is blocked',
                status:  401
            });
        });

        it('should return the issued token if the user exist and is already connected with the provider', function() {
            return appWithoutWhiteList.connect('facebook', 'facebook', {
                _json: {
                    id:      '21312321321asdasdsads231231223',
                    email:   'ricky@gmail.com',
                    picture: {
                        data: {
                            url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                        }
                    }
                },
                displayName: 'Ricardito'
            }).then(() => {
                appWithoutWhiteList.issueToken.calledOnce.should.be.true();
            });
        });

        it('should call user.link if the user is not connected with the provider', function() {
            return appWithoutWhiteList.connect('facebook', 'facebook', {
                _json: {
                    id:      '21312321321asdasdsads231231223',
                    email:   'ric@gmail.com',
                    picture: {
                        data: {
                            url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                        }
                    }
                },
                displayName: 'Ricardito'
            }).then(() => {
                linkedUser.link.calledOnce.should.be.true();
                appWithoutWhiteList.issueToken.calledOnce.should.be.true();
            });
        });
    });

    describe('createLinkUser', function() {
        let app;

        beforeEach(function() {
            app = new App({
                _id:     '586eccfe99a39c001776f81a',
                name:    'MostazaApp',
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'facebook',
                        connection:    'facebook',
                        appId:         '362471190780643',
                        signupEnabled: true,
                        appSecret:     '478f14a56b4832f004e69dfc9b1ed56b',
                        attributes:    ['id', 'displayName', 'picture', 'emails', 'birthday', 'context', 'gender', 'first_name', 'last_name', 'middle_name'],
                        permissions:   ['public_profile', 'email', 'user_religion_politics', 'user_birthday']
                    },
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: false,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     'cAa76h_CDm5Y6sm8G8neBETV',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ]
            });

            app.issueToken = sinon.spy();
        });

        it('should reject when the user exist and is already linked with the provider', function() {
            return app
                .createLinkUser('facebook', 'facebook', {
                    _json: {
                        id:      '21312321321asdasdsads231231223',
                        email:   'ricky@gmail.com',
                        picture: {
                            data: {
                                url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                            }
                        }
                    },
                    displayName: 'Ricardito'
                }).should.be.rejectedWith(Error, {
                message: 'The user is already linked with this facebook identity',
                status:  500
            });
        });

        it('should call issueToken when the user isn\'t already connected with the provider', function() {
            return app
                .createLinkUser('facebook', 'facebook', {
                    _json: {
                        id:      '21312321321asdasdsads231231224',
                        email:   'ricky@gmail.com',
                        picture: {
                            data: {
                                url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                            }
                        }
                    },
                    displayName: 'Ricardito'
                })
                .then(() => {
                    app.issueToken.calledOnce.should.be.true();
                });
        });
    });

    describe('createFor', function() {
        let app;

        beforeEach(function() {
            app = new App({
                _id:     '586eccfe99a39c001776f81a',
                name:    'MostazaApp',
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'facebook',
                        connection:    'facebook',
                        appId:         '362471190780643',
                        signupEnabled: true,
                        appSecret:     '478f14a56b4832f004e69dfc9b1ed56b',
                        attributes:    ['id', 'displayName', 'picture', 'emails', 'birthday', 'context', 'gender', 'first_name', 'last_name', 'middle_name'],
                        permissions:   ['public_profile', 'email', 'user_religion_politics', 'user_birthday']
                    },
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: false,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     'cAa76h_CDm5Y6sm8G8neBETV',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ]
            });
        });

        it('should call create on the collection passed as parameter with the user profile', function() {
            const collection = {
                create: sinon.stub().resolves()
            };

            return app
                .createFor(collection, 'facebook', 'facebook', {
                    _json: {
                        id:      '21312321321asdasdsads231231224',
                        email:   'ricky@gmail.com',
                        picture: {
                            data: {
                                url: 'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg'
                            }
                        }
                    },
                    displayName: 'Ricardito'
                }, false)
                .then(() => {
                    collection.create.calledOnce.should.be.true();
                });
        });
    });

    describe('link', function() {
        let app;

        beforeEach(function() {
            app = new App({
                _id:     '586eccfe99a39c001776f81a',
                name:    'MostazaApp',
                plugins: [{
                    name:              'kong',
                    issueTokenEnabled: true,
                    context:           {
                        kongUrl:        'http://kong-2:8000/admin',
                        kongApiKeyPath: 'apikey',
                        kongApiKey:     'unakey'
                    }
                }],
                minimalUserEnabled: false,
                oauthConnections:   [
                    {
                        type:          'facebook',
                        connection:    'facebook',
                        appId:         '362471190780643',
                        signupEnabled: true,
                        appSecret:     '478f14a56b4832f004e69dfc9b1ed56b',
                        attributes:    ['id', 'displayName', 'picture', 'emails', 'birthday', 'context', 'gender', 'first_name', 'last_name', 'middle_name'],
                        permissions:   ['public_profile', 'email', 'user_religion_politics', 'user_birthday']
                    },
                    {
                        type:          'google',
                        connection:    'google',
                        signupEnabled: false,
                        appId:         '99188765334-0ltg62s70g937udjsu40u99t8auuq816.apps.googleusercontent.com',
                        appSecret:     'cAa76h_CDm5Y6sm8G8neBETV',
                        attributes:    ['emails', 'url'],
                        permissions:   ['https://www.googleapis.com/auth/plus.profile.emails.read']
                    }
                ]
            });

            app.issueToken = sinon.spy();
        });


        it('should reject with error when the user to link hasn\'t got the provider identity', function() {
            return app
                .link('58add06ab4a022439fe9ab3c', 'facebook', 'facebook',
                    {
                        profile: {
                            email:         'ricky@gmail.com',
                            picture:       'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
                            nickname:      'Ricardito',
                            app:           '586eccfe99a39c001776f81a',
                            identities:    [],
                            emailVerified: false,
                            blocked:       false,
                            roles:         []
                        }
                    })
                .should.be.rejectedWith(Error,
                {
                    message: 'The user to link hasn\'t got a facebook identity.',
                    status:  500
                });
        });

        it('should reject with error when the user dosen\'t exist', function() {
            return app
                .link('58add06ab4a022439fe9ab3c', 'facebook', 'facebook',
                    {
                        profile: {
                            email:      'ricky@gmail.com',
                            picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
                            nickname:   'Ricardito',
                            app:        '586eccfe99a39c001776f81a',
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
                        }
                    })
                .should.be.rejectedWith(Error,
                {
                    message: 'The user 58add06ab4a022439fe9ab3c was not found.',
                    status:  404
                });
        });

        it('should reject with error when the user is already linked', function() {
            return app
                .link('58add06ab4a022439fe9ab3d', 'facebook', 'facebook',
                    {
                        profile: {
                            email:      'ricky@gmail.com',
                            picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
                            nickname:   'Ricardito',
                            app:        '586eccfe99a39c001776f81a',
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
                        }
                    })
                .should.be.rejectedWith(Error,
                {
                    message: 'The user has already linked a facebook account.',
                    status:  401
                });
        });

        it('should issue the token when it fullfils all the validations', function() {
            return app
                .link('58add06ab4a022439fe9ab3e', 'facebook', 'facebook',
                    {
                        profile: {
                            email:      'ricky@gmail.com',
                            picture:    'http://media.diarioveloz.com/adjuntos/120/imagenes/001/115/0001115585.jpg',
                            nickname:   'Ricardito',
                            app:        '586eccfe99a39c001776f81a',
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
                        }
                    })
                .then(() => {
                    app.issueToken.calledOnce.should.be.true();
                });
        });
    });
});
