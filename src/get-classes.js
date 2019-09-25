const mysql = require("./src/db");

module.exports = async message => {
  return await mysql.query("SELECT name, teacher, period FROM class WHERE student_id = ?", [message.author.id]);
}