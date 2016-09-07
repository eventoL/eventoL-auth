'use strict';
const userModel = require('./user');
const refreshTokenModel = require('./refreshToken');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

function initializeModels(config) {
    mongoose.connect(`mongodb://${config.mongo.host}:${config.mongo.port}`);

    return {
        userModel,
        refreshTokenModel
    };
}


module.exports = initializeModels;
