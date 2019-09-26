const Discord = require("discord.js");  
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const fs = require("fs");
const mysql = require("./db");
const classAbbreviations = require("./class-names").abbreviations;
const axios = require("axios");

if (!process.env.DEV) {
  setInterval(() => axios(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`), 280000);
}

Discord.Channel.prototype.embed = async function(content) {
  if (typeof content === "string") {
    return this.send({
      embed: {
        color: 0xffd000,
        title: content
      }
    });
  } else {
    return this.send({
      embed: {
        color: 0xffd000,
        ...content
      }
    });
  }
}
Discord.User.prototype.embed = async function(content) {
  if (typeof content === "string") {
    return this.send({
      embed: {
        color: 0xffd000,
        title: content
      }
    });
  } else {
    return this.send({
      embed: {
        color: 0xffd000,
        ...content
      }
    });
  }
}
Discord.Message.prototype.embed = async function(content) {
  return this.channel.embed(content);
}

const client = new Discord.Client();

const commands = {};
fs.readdirSync('./src/commands/').forEach(file => {
  const command = require("../src/commands/" + file);
  commands[command.name] = command;
});

client.on("message", async message => {
  if (!process.env.DEV && message.guild && message.guild.id === "614245363498483712") return;
  if (process.env.DEV && message.guild && message.guild.id !== "614245363498483712") return;
  if (!message.content.startsWith("?")) return;
  const args = message.content.slice(1).split(/ +/);
  const commandName = args.shift().toLowerCase();
  if (!(commandName in commands)) return;
  const command = commands[commandName];
  const executeArgs = [message, args];
  let loadingMessage;
  if (command.async) {
    loadingMessage = await message.embed("Loading...");
    executeArgs.push(loadingMessage);
  }
  if (command.usesDay || command.usesQ) {
    if ((await mysql.query("SELECT name FROM class WHERE student_id = ?", [message.author.id])).length == 0) {
      message.embed("You need to be registered to use that command.");
      if (loadingMessage) loadingMessage.delete();
      return;
    } else {
      if (command.usesDay) {
        const day = (await mysql.query("SELECT period FROM class WHERE student_id = ? AND name = ?", [message.author.id, classAbbreviations[command.name] || command.name]))[0].period[1];
        executeArgs.push(day);
      }
      if (command.usesQ) {
        for (const student of await mysql.query("SELECT * FROM student")) {
          if (bcrypt.compareSync(message.author.id, student.id)) {
            executeArgs.push({
              id: CryptoJS.AES.decrypt(student.q_id, message.author.id).toString(CryptoJS.enc.Utf8),
              password: CryptoJS.AES.decrypt(student.q_password, message.author.id).toString(CryptoJS.enc.Utf8)
            });
            break;
          }
        }
      }
    }
  }
  command.execute(...executeArgs);
});

client.login(process.env.DEV ? require("../auth.json").BOT_TOKEN : process.env.BOT_TOKEN);