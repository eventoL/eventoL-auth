'use strict';

const baucis     = require('baucis');
const models     = require('./lib/models');
const decorators = require('./lib/decorators');

function buildBaucis() {
    Object.keys(models).forEach((modelName) => {
        const controller = baucis.rest(models[modelName]);
        if (decorators.hasOwnProperty(modelName)) {
            decorators[modelName](controller);
        }
    });

    return baucis();
}

module.exports = buildBaucis;
