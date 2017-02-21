'use strict';

require('should');
const JWT   = require('../lib/JWT');
const sinon = require('sinon');

describe('JWT', function() {
    describe('get', function() {
        it('should reject if the jwt is not present in the headers or in the querystring', function() {
            return JWT.get({}).should.be.rejectedWith({
                message: 'Unauthorized',
                status:  401
            });
        });

        it('should resolve with the jwt if the jwt is present in the headers', function() {
            return JWT
                .get({
                    headers: {
                        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
                    }
                })
                .should.be.fulfilledWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ');
        });

        it('should resolve with the jwt if the jwt is present in the querystring', function() {
            return JWT
                .get({
                    query: {
                        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
                    }
                })
                .should.be.fulfilledWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ');
        });
    });

    describe('decode', function() {
        it('should throws an error if the jwt is null', function() {
            (() => JWT.decode(null) ).should.throw(Error, {
                message: 'Unauthorized',
                status:  401
            });
        });

        it('should throws an error if the jwt is undefined', function() {
            (() => JWT.decode(undefined) ).should.throw(Error, {
                message: 'Unauthorized',
                status:  401
            });
        });

        it('should return the user when the jwt is passed', function() {
            const user = JWT.decode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ');
            user.sub.should.be.equal('1234567890');
            user.admin.should.be.equal(true);
            user.name.should.be.equal('John Doe');
        });
    });

    describe('extract', function() {
        let next;

        beforeEach(function() {
            next = sinon.spy();
        });

        it('should load the user on the user attribute and call the callback of the request when passing the jwt in the headers', function() {
            const request = {
                headers: {
                    authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
                }
            };

            return JWT.extract(request, {}, next)
                .then(() => {
                    request.user.sub.should.be.equal('1234567890');
                    request.user.admin.should.be.equal(true);
                    request.user.name.should.be.equal('John Doe');
                    next.calledOnce.should.be.equal(true);
                });
        });

        it('should load the user on the user attribute and call the callback of the request when passing the jwt in the querystring', function() {
            const request = {
                query: {
                    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
                }
            };

            return JWT.extract(request, {}, next)
                .then(() => {
                    request.user.sub.should.be.equal('1234567890');
                    request.user.admin.should.be.equal(true);
                    request.user.name.should.be.equal('John Doe');
                    next.calledOnce.should.be.equal(true);
                });
        });

        it('should send a 401 response if no jwt is sent', function() {
            const json = sinon.spy();

            const response = {
                status: sinon.stub().returns({
                    json
                }),
                json
            };

            return JWT.extract({}, response, next)
                .then(() => {
                    next.calledOnce.should.be.equal(false);
                    response.status.calledWith(401).should.be.equal(true);
                    response.json.calledWith({
                        message: 'Unauthorized'
                    }).should.be.equal(true);
                });
        });

        it('should send a 401 response if the jwt sent is invalid', function() {
            const json = sinon.spy();

            const response = {
                status: sinon.stub().returns({
                    json
                }),
                json
            };

            const request = {
                query: {
                    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibm6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95M7E2cBb30RMHrHDcEfxjoYZgeFONFh7HgQ'
                }
            };

            return JWT.extract(request, response, next)
                .then(() => {
                    next.calledOnce.should.be.equal(false);
                    response.status.calledWith(401).should.be.equal(true);
                    response.json.calledWith({
                        message: 'Unauthorized'
                    }).should.be.equal(true);
                });
        });
    });

    describe('issue', function() {
        it('should return a jwt signed with the secret when calling issue', function() {
            const jwt = JWT.issue({
                sub:   '1234567890',
                name:  'John Doe',
                admin: true
            }, 'secretin');

            return JWT.verify(jwt, 'secretin').should.be.fulfilled();
        });
    });

    describe('verify', function() {
        it('should resolve the user when te secret is valid', function() {
            const jwt = JWT.issue({
                sub:   '1234567890',
                name:  'John Doe',
                admin: true
            }, 'secretin');

            return JWT
                .verify(jwt, 'secretin')
                .then((user) => {
                    user.profile.sub.should.be.equal('1234567890');
                    user.profile.name.should.be.equal('John Doe');
                    user.profile.admin.should.be.equal(true);
                });
        });

        it('should reject it the secret is invalid', function() {
            const jwt = JWT.issue({
                sub:   '1234567890',
                name:  'John Doe',
                admin: true
            }, 'secretin');

            return JWT
                .verify(jwt, 'pedro')
                .should.be.rejected();
        });
    });
});
