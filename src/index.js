const Discord = require("discord.js");  
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const fs = require("fs");

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

const mysql = require("./db");

const classAbbreviations = require("./class-names").abbreviations;

const client = new Discord.Client();

const commands = {};
fs.readdirSync('./src/commands/').forEach(file => {
  const command = require("../src/commands/" + file);
  commands[command.name] = command;
});

const formatCommands = commands => commands.map(command => `**?${command[0]}** - ${command[1]}`).join("\n");

const unregisteredCommands = formatCommands([
  ["help", "displays the list of commands that you can use"],
  ["register <id> <password>", "registers you with your Q id and password so that you can use commands that require registration"],
  ["today", "tells you the current date and whether it's an A day or a B day"],
  ["last", "tells you the last school day (including the current day) and whether it was an A day or a B day"],
  ["last a", "tells you the last A day (including the current day)"],
  ["last b", "tells you the last B day (including the current day)"],
  ["next", "tells you the next school day (after the current day) and whether it will be an A day or a B day"],
  ["next a", "tells you the next A day (after the current day)"],
  ["next b", "tells you the next B day (after the current day)"],
  ["ping", "pong"]
]);

const classCommands = [
  ["hw <teacher>", "tells you the homework assigned from <teacher>"]
];
const qCommands = [

];
const bothCommands = [

];
const unformattedRegisteredCommands = [...classCommands, ...qCommands, ...bothCommands];
const registeredCommands = formatCommands(unformattedRegisteredCommands);

/*
(async () => {
  for (const student of await mysql.query("SELECT id FROM student")) {
    if (bcrypt.compareSync("300360107848630272", student.id)) mysql.query("DELETE FROM student WHERE id = ?", [student.id]);
  }
})();
(async () => {
  for (const clazz of await mysql.query("SELECT student_id FROM class")) {
    if (clazz.student_id === "300360107848630272") mysql.query("DELETE FROM class WHERE student_id = ?", [clazz.student_id]);
  }
})();
*/

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