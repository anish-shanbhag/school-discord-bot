const mysql = require("serverless-mysql")({
  config: {
    host: "remotemysql.com",
    database: "VmdAL4vT7i",
    user: "VmdAL4vT7i",
    password: process.env.DEV ? require("../auth.json").DATABASE_PASSWORD : process.env.DATABASE_PASSWORD
  }
});

module.exports = mysql;