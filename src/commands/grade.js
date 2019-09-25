const Discord = require("discord.js");
const q = require("../q");
const fullClassNames = require("../class-names").fullNames;

module.exports = {
  name: "grade",
  description: "Sends you a DM containing your grade in <class>",
  usage: "<class>",
  async: true,
  usesQ: true,
  async execute(message, args, loadingMessage, qInfo) {
    const fullClassName = fullClassNames[args[0]];
    if (fullClassName) {
      const page = await q.full(qInfo.id, qInfo.password);
      const grade = await page.evaluate(fullClassName => {
        const tables = [...document.querySelectorAll("#SP_Assignments table")];
        for (const table of tables) {
          if (table.querySelector("caption b").innerText.split("(")[0].trim() === fullClassName) {
            return table.querySelector("td").innerText.split(":")[1].trim();
          }
        }
      }, fullClassName);
      loadingMessage.delete();
      if (!(message.channel instanceof Discord.DMChannel)) {
        message.embed("A direct message has been sent to you with your grade!");
      }
      message.author.embed(`Your grade in ${fullClassName} is: ${grade}`);
    } else {
      loadingMessage.delete();
      message.embed("Class not found :(")
    }
  }
}