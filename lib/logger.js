'use strict';

var winston = require('winston');
var logger;

if (process.env.NODE_ENV === 'production') {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                timestamp:        true,
                colorize:         false,
                level:            'info',
                handleExceptions: true
            }),
            new (winston.transports.File)({
                name:        'infoFile',
                filename:    process.env.EVENTOL_AUTH_LOGGER_INFO_PATH,
                level:       process.env.EVENTOL_AUTH_LOGGER_INFO_LEVEL,
                prettyPrint: false,
                json:        true,
                colorize:    false,
                maxsize:     process.env.EVENTOL_AUTH_LOGGER_FILE_MAX_SIZE,
                maxFiles:    process.env.EVENTOL_AUTH_LOGGER_MAX_FILES
            }),
            new (winston.transports.File)({
                name:        'errorFile',
                filename:    process.env.EVENTOL_AUTH_LOGGER_ERROR_PATH,
                level:       process.env.EVENTOL_AUTH_LOGGER_ERROR_LEVEL,
                prettyPrint: false,
                json:        true,
                colorize:    false,
                maxsize:     process.env.EVENTOL_AUTH_LOGGER_FILE_MAX_SIZE,
                maxFiles:    process.env.EVENTOL_AUTH_LOGGER_MAX_FILES
            })
        ],
        exitOnError: true
    });
} else {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                timestamp: true,
                colorize:  true,
                level:     'debug'
            })
        ]
    });
}

module.exports = logger;
