[![Stories in Ready](https://badge.waffle.io/eventoL/eventoL-auth.png?label=ready&title=Ready)](https://waffle.io/eventoL/eventoL-auth)
# eventoL-auth
Authenticate and link oauth2 profiles.

## Configuration

If eventoL-auth is run as a standalone server you must provide the configuration in the .env file.
The .env must contain the next variables:

* EVENTOL_AUTH_JWT_SECRET: The secret that will be used to sign the [json web token](https://jwt.io/).
* EVENTOL_AUTH_JWT_EXPIRES: Expiration time of the token expressed in seconds or a string describing a time span [rauchg/ms](https://github.com/rauchg/ms.js). Eg: 60, "2 days", "10h", "7d".
* EVENTOL_AUTH_MONGO_PORT: The port of the mongo instance where the users and refresh tokens will be saved.
* EVENTOL_AUTH_MONGO_HOST: The host of the mongo instance where the users and refresh tokens will be saved.
* EVENTOL_AUTH_SERVER_HOST: The host of the server where the auth api will run.
* EVENTOL_AUTH_SERVER_PORT: The port of the server where the auth api will run.
* EVENTOL_AUTH_TWITTER_CONSUMER_KEY: The consumer key of your twitter app.
* EVENTOL_AUTH_TWITTER_CONSUMER_SECRET: The consumer secret of your twitter app.

For example:
```bash
EVENTOL_AUTH_JWT_SECRET=TheJsonWebTokenSecret
EVENTOL_AUTH_JWT_EXPIRES=1d
EVENTOL_AUTH_MONGO_PORT=27017
EVENTOL_AUTH_MONGO_HOST=localhost
EVENTOL_AUTH_SERVER_HOST=localhost
EVENTOL_AUTH_SERVER_PORT=8080
EVENTOL_AUTH_TWITTER_CONSUMER_KEY=ATwitterConsumerKey
EVENTOL_AUTH_TWITTER_CONSUMER_SECRET=ATwitterSecretKey
```

If eventoL-auth is run as an express module you have to call the router function with a configuration object with these attributes:

* twitter.consumerKey: The consumer key of your twitter app.
* twitter.comsumerSecret: The consumer secret of your twitter app.
* jwt.secret: The secret that will be used to sign the [json web token](https://jwt.io/).
* jwt.expires: Expiration time of the token expressed in seconds or a string describing a time span [rauchg/ms](https://github.com/rauchg/ms.js). Eg: 60, "2 days", "10h", "7d".
* models.mongo.host: The host of the mongo instance where the users and refresh tokens will be saved.
* models.mongo.port: The port of the mongo instance where the users and refresh tokens will be saved.

For example:
```javascript
{
    twitter: {
        consumerKey: 'ATwitterConsumerKey',
        consumerSecret: 'ATwitterSecretKey'
    },
    jwt: {
        secret: 'TheJsonWebTokenSecret',
        expires: '1d'
    },
    models: {
        mongo: {
            host: '27017',
            port: 'localhost'
        }
    }
}
```
