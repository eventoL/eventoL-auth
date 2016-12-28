'use strict';

const mongoose = require('mongoose');

const SocialConnectionSchema = new mongoose.Schema({
    _id: {
        type:     String,
        required: true,
        unique:   true
    },
    attributes:  [String],
    permissions: [String]
});

SocialConnectionSchema.swaggerName = 'SocialConnection';

module.exports = mongoose.model('SocialConnection', SocialConnectionSchema);
