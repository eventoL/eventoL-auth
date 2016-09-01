'use strict';

const express = require('express');
const config = require('./config');
const authRouter = require('./lib/routes');
const app = express();
const cors = require('cors');
const router = authRouter(config);

app.use(cors());
app.use('/', router);

app.listen(config.server.port, config.server.host, (error) => {
    if (error) {
        throw error;
    }

    console.log(`Server listening on http://${config.server.host}:${config.server.port}`);
});
