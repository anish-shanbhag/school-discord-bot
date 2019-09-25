const mysql = require("../db");
const bcrypt = require("bcryptjs");

module.exports = {
  name: "unregister",
  description: "completely unregisters you, meaning you won't be able to use commands which require registration",
  async: true,
  usesQ: true,
  async execute(message, args, loadingMessage) {
    for (const student of await mysql.query("SELECT id FROM student")) {
      if (bcrypt.compareSync(message.author.id, student.id)) {
        await mysql.query("DELETE FROM student WHERE id = ?", [student.id]);
      }
    }
    await mysql.query("DELETE FROM class WHERE student_id = ?", [message.author.id]);
    loadingMessage.delete();
    message.embed("You have successfully been unregistered!");
  }
}