const pg = require('pg');

const client = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'webhook_dialogflow',
    password: 'postdba',
    port: 5432
});

module.exports = client;