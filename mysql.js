'use strict';

/*
Create a DB connection and do the query.

The return [rows] for SQL INSERT or UPDATE:
    {"fieldCount":0,"affectedRows":1,"insertId":1,"info":"","serverStatus":2,"warningStatus":0}
 */
async function doQueryOnce(sql, values, config, mysql) {
  let conn = null;
  try {
    conn = await mysql.createConnection(config);
    await conn.connect();
    return await doQuery(sql, values, conn);
  } catch (e) {
    // Mask the password.
    const conf = {...config};
    conf.password = 'x'.repeat(config.password.length);

    const err = {name: e.name, message: e.message, stack: e.stack};
    console.log(`db query once, sql=${sql}, values=${JSON.stringify(values)}, config=${JSON.stringify(conf)}, err=${JSON.stringify(err)}`);
    throw e;
  } finally {
    if (conn) await conn.end();
  }
}

async function doQuery(sql, values, mysql) {
  try {
    const [rows, fields] = await mysql.query(sql, values);
    return [rows, fields, sql, values];
  } catch (e) {
    const err = {name: e.name, message: e.message, stack: e.stack};
    console.log(`db doQuery err sql=${sql}, values=${JSON.stringify(values)}, err=${JSON.stringify(err)}`);
    throw e;
  }
}

/*
The config SHOULD be config:Object for MySQL db, with bellow fields:
    {host, port, database, user, password}
well, the password is optional, which might for user without password.

For example:
    const config = {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        database: process.env.MYSQL_DB,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
    };
    const mysql2 = require('mysql2/promise');
    const mysql = require('js-core/mysql').create({config, mysql: mysql2});

    const [rows, fields, sql, values] = await mysql.query(
        'SELECT * FROM verify_code where sessionId=?', [sessionId],
    );

Or execute DB transaction by connection:
    // @see https://github.com/sidorares/node-mysql2/issues/384#issuecomment-673726520
    // @see https://stackoverflow.com/a/39754511
    const conn = await mysql.connect();
    try {
        await conn.beginTransaction();
        const [rows, fields] = await conn.query("SELECT * FROM tbl_sample");
        await conn.query("INSERT INTO tbl_sample SET data = ?", ["some_data"]);
        await conn.commit();
        return rows;
    } catch (e) {
        await conn.rollback();
    } finally {
        conn.end();
    }
 */
function create({config, mysql}) {
  if (!mysql) throw new Error(`mysql required`);
  if (!config) throw new Error(`config required`);
  if (!config.host) throw new Error(`config.host required`);
  if (!config.port) throw new Error(`config.port required`);
  if (!config.database) throw new Error(`config.database required`);
  if (!config.user) throw new Error(`config.user required`);

  // Read default configs from env.
  // @see https://github.com/mysqljs/mysql#connection-options
  const dbConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
  };

  // Never use MySQL datetime object parse.
  dbConfig.dateStrings = true;

  return {
    query: async function (sql, values) {
      return doQueryOnce(sql, values, dbConfig, mysql);
    },
  };
}

module.exports = {
  create,
};

