'use strict';

const mongoose     = require('mongoose');
const jsonwebtoken = require('jsonwebtoken');

const AppSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User'
    },
    name: {
        type:     String,
        required: true,
        unique:   true
    },
    clientId: {
        type:     String,
        required: true,
        unique:   true,
        indexed:  true
    },
    clientSecret: {
        type:     String,
        required: true,
        unique:   true
    },
    localLoginEnabled: {
        type:    Boolean,
        default: false
    },
    socialConnections: [{
        type: {
            type: String,
            ref:  'SocialConnection'
        },
        appId: {
            type:     String,
            required: true
        },
        appSecret: {
            type:     String,
            required: true
        },
        attributes:  [String],
        permissions: [String]
    }],
    callbackUrls:  [String],
    logoutUrls:    [String],
    jwtExpiration: {
        type:    Number,
        default: 36000
    },
    hostedPages: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'HostedPage'
    },
    defaultRoles: {
        type:    [String],
        default: ['user']
    },
    roles: [String]
});

AppSchema.statics.fromUser = function fromUser(id) {
    return this.find(
        {
            owner: id
        }, {
            _id: 1
        })
        .exec()
        .then((docs) => docs.map((doc) => doc._id));
};

AppSchema.statics.validate = function validate(clientId, provider) {
    return this
        .findOne({
            clientId
        })
        .exec()
        .then((application) => {
            if (application === null || typeof application === 'undefined') {
                const error = new Error(`Application ${clientId} not found.`);
                error.status = 404;
                throw error;
            }

            return application;
        })
        .then((application) => {
            const applicationProviders = application.socialConnections.map((socialConnection) => socialConnection.type);

            if (!applicationProviders.includes(provider)) {
                const error = new Error(`Application ${clientId} hasn't set the ${provider} provider.`);
                error.status = 500;
                throw error;
            }

            return application;
        });
};

AppSchema.methods.issueToken = function issueToken(user) {
    const issuer = user._id.toString();

    Reflect.deleteProperty(user, '_id');
    Reflect.deleteProperty(user, '__v');

    return jsonwebtoken.sign({
        profile: user
    }, this.clientSecret, {
        expiresIn: this.jwtExpiration,
        notBefore: '1ms',
        issuer
    });
};

AppSchema.swaggerName = 'App';

module.exports = mongoose.model('App', AppSchema);
