'use strict';

const Koa = require('koa');
const Cors = require('koa2-cors');
const BodyParser = require('koa-bodyparser');
const pkg = require('./package.json');

if (!process.env.MYSQL_HOST) throw new Error('no env MYSQL_HOST');
if (!process.env.MYSQL_PORT) throw new Error('no env MYSQL_PORT');
if (!process.env.MYSQL_DB) throw new Error('no env MYSQL_DB');
if (!process.env.MYSQL_USER) throw new Error('no env MYSQL_USER');
const config = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DB,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
};
const mysql2 = require('mysql2/promise');
const mysql = require('./mysql').create({config, mysql: mysql2});

// Create koa webserver.
const app = new Koa();

// Always enable CORS for statics or apis.
app.use(Cors());

// Start body-parser only for APIs, which requires the body.
app.use(BodyParser());

// Echo client information.
app.use(async (ctx, next) => {
  const [[{r0}]] = await mysql.query('select CURRENT_TIMESTAMP as r0');
  const [r1] = await mysql.query('show tables');

  ctx.body = {
    version: pkg.version,
    ip: ctx.request.ip,
    method: ctx.request.method,
    path: ctx.request.path,
    header: ctx.request.header,
    query: ctx.request.query,
    body: ctx.request.body,
    db: {
      timestamp: r0,
      tables: r1.length,
    },
  };
});

app.listen(8080, () => {
  console.log(`Server start on http://localhost:8080`);
});

