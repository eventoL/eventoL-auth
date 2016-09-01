'use strict';

require('dotenv').load();

module.exports = {
    twitter: {
        consumerKey: process.env.EVENTOL_AUTH_TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.EVENTOL_AUTH_TWITTER_CONSUMER_SECRET
    },
    jwt: {
        secret: process.env.EVENTOL_AUTH_JWT_SECRET,
        expires: process.env.EVENTOL_AUTH_JWT_EXPIRES
    },
    server: {
        host: process.env.EVENTOL_AUTH_SERVER_HOST,
        port: process.env.EVENTOL_AUTH_SERVER_PORT
    },
    modelsPath: process.env.EVENTOL_AUTH_USER_MODEL_PATH || './models',
    models: {
        mongo: {
            host: process.env.EVENTOL_AUTH_MONGO_HOST,
            port: process.env.EVENTOL_AUTH_MONGO_PORT
        }
    }
};
