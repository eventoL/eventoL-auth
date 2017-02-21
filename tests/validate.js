'use strict';

const should   = require('should');
const validate = require('../lib/validate');

describe('Validate', function() {
    it('nothing should happen if the condition is false', function() {
        validate(false, 'You will never see mee', 1 / 0);
    });

    it('should throw an error with the message passed as parameter if the condition is true', function() {
        (() => validate(true, 'Oopsie an error happened :(')).should.throw(Error, {
            message: 'Oopsie an error happened :('
        });
    });

    it('should throw an error with the message and the status code passed as parameter if the condition is true', function() {
        (() => validate(true, 'Oopsie an error happened :(', 500)).should.throw(Error, {
            message: 'Oopsie an error happened :(',
            status:  500
        });
    });
});
