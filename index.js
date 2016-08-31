'use strict';

const express = require('express');
const config = require('./lib/config');
const authRouter = require('./lib/routes');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use('/', authRouter);

app.listen(config.server.port, config.server.host, (error) => {
    if (error) {
        throw error;
    }

    console.log(`Server listening on http://${config.server.host}:${config.server.port}`);
});
