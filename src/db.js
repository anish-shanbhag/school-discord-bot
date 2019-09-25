const mysql = require("serverless-mysql")({
  config: {
    host: "remotemysql.com",
    database: "k2nadU14ft",
    user: "k2nadU14ft",
    password: process.env.DEV ? require("../auth.json").DATABASE_PASSWORD : process.env.DATABASE_PASSWORD
  }
});

module.exports = mysql;