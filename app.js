'use strict';

require('dotenv').load();
const express        = require('express');
const app            = express();
const cors           = require('cors');
const compression    = require('compression');
const bodyParser     = require('body-parser');
const helmet         = require('helmet');
const logger         = require('./lib/logger');
const expressWinston = require('express-winston');
const swaggerTools   = require('swagger-tools');

if (process.env.EVENTOL_AUTH_IS_BEHIND_PROXY) {
    // http://expressjs.com/api.html#trust.proxy.options.table
    app.enable('trust proxy');
}

app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.frameguard());
app.use(helmet.xssFilter());
app.use(compression());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(expressWinston.logger({
    winstonInstance: logger,
    expressFormat:   true,
    colorize:        false,
    meta:            false,
    statusLevels:    true
}));

//Baucis configuration
const mongoose = require('mongoose');
mongoose.connect('mongodb://' + process.env.EVENTOL_AUTH_MONGODB_HOST + ':' + process.env.EVENTOL_AUTH_MONGODB_PORT + '/' + process.env.EVENTOL_AUTH_MONGODB_DB);
mongoose.Promise = global.Promise;

const buildBaucis    = require('./build-baucis');
const baucisInstance = buildBaucis();

//Configure swagger-tools
const swaggerDoc = require('./swagger/swagger.json');
swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
    // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
    app.use(middleware.swaggerMetadata());

    //Enables Swagger Ui on /docs
    app.use(middleware.swaggerUi());

    // Route validated requests to appropriate controller

    app.use('/api', baucisInstance);

    app.use(middleware.swaggerRouter({
        controllers:           './lib/routes',
        ignoreMissingHandlers: true,
        useStubs:              false // Conditionally turn on stubs (mock mode)
    }));

    app.use(expressWinston.errorLogger({
        winstonInstance: logger
    }));

    app.use(function(err, req, res, next) {
        if (res.headersSent) {
            return next(err);
        }
        res.status(err.status || 500);
        let error = {
            errorCode:   res.status,
            userMessage: err.message
        };

        if (process.env.NODE_ENV === 'development') {
            error.stack = err;
        }

        return res.json(error);
    });

    app.use(function(req, res) {
        res.status(404).json({
            errorCode:   404,
            userMessage: 'Not found.'
        });
    });

    // Start the server
    app.listen(process.env.EVENTOL_AUTH_SERVER_PORT, process.env.EVENTOL_AUTH_SERVER_HOST);
    logger.info('Your server is listening on port %d (http://%s:%d)', process.env.EVENTOL_AUTH_SERVER_PORT, process.env.EVENTOL_AUTH_SERVER_HOST,
        process.env.EVENTOL_AUTH_SERVER_PORT);
});
