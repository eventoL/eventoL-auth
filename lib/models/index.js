'use strict';
const userModel = require('./user');
const refreshTokenModel = require('./refreshToken');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

function initializeStore() {
    mongoose.connect(`mongodb://${process.env.EVENTOL_AUTH_MONGO_HOST}:${process.env.EVENTOL_AUTH_MONGO_PORT}`);
}

module.exports = {
    userModel,
    refreshTokenModel,
    initializeStore
};
