const mysql = require("../db");
const q = require("../q");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const Discord = require("discord.js");

const classAbbreviations = require("../class-names").abbreviations;

module.exports = {
  name: "register",
  description: "registers you with your Q id and password so that you can use commands that require registration",
  usage: "<id> <password>",
  async: true,
  async execute(message, args, loadingMessage) {
    if (!args[0] || !args[1]) {
      loadingMessage.delete();
      message.embed("You must add an id and password to the register command.");
      return;
    } else {
      const students = await mysql.query("SELECT id FROM student");
      if (students.every(student => !bcrypt.compareSync(message.author.id, student.id))) {
        bcrypt.hash(message.author.id, 10, async (error, hash) => {
          let page = await q.login(args[0], args[1]);
          const result = await page.waitFor(".sturow, #msgdisplay:not([style*='display'])");
          if (result._remoteObject.description === "div#msgdisplay") {
            loadingMessage.delete();
            await message.embed("Registration failed - your login information is incorrect.")
          } else {
            page = await q.load(page);
            const classes = await page.evaluate(() => {
              return [...document.querySelectorAll("#SP-Schedule > tbody > tr")]
                .map(row => ({
                  name: row.querySelector(":nth-child(6)").innerText,
                  teacher: row.querySelector(":nth-child(7) > a").innerText.split(",")[0].toLowerCase(),
                  period: row.querySelector(":nth-child(2)").innerText + row.querySelector(":nth-child(3)").innerText
                })).filter(clazz => clazz.period !== "1B");
            });
            const encryptedID = CryptoJS.AES.encrypt(args[0], message.author.id).toString();
            const encryptedPassword = CryptoJS.AES.encrypt(args[1], message.author.id).toString();
            await mysql.query("INSERT INTO student VALUES (?, ?, ?)", [hash, encryptedID, encryptedPassword]);
            const classValues = classes.map(clazz => [classAbbreviations[clazz.name] || clazz.name, message.author.id, clazz.teacher, clazz.period]).flat();
            await mysql.query("INSERT INTO class VALUES " + new Array(classes.length).fill("(?, ?, ?, ?)").join(", "), classValues);
            loadingMessage.delete();
            message.embed({
              title: "You've been registered! Here are your classes:",
              fields: [{
                name: "Name, Teacher, Period",
                value: classes.map(clazz => `${classAbbreviations[clazz.name] || clazz.name}, ${clazz.teacher}, ${clazz.period}`).join("\n")
              }]
            });
          }
          await page.browser().close();
        });
      } else {
        loadingMessage.delete();
        message.embed("It looks like you've already registered.");
      }
    }
  }
}