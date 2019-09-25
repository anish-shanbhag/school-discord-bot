const fs = require("fs");
const classNames = require("../class-names").fullNames;
module.exports = {
  name: "help",
  description: "displays the list of commands that you can use",
  execute(message, args) {
    const commandFiles = fs.readdirSync(__dirname);
    const registeredCommands = [];
    const unregisteredCommands = [];
    commandFiles.forEach(file => {
      const command = require("./" + file);
      if (command.usesDay || command.usesQ) registeredCommands.push(command);
      else unregisteredCommands.push(command);
    });
    const format = commands => "⠀\n" + commands.map(command => `**?${command.name}${command.usage ? ` ${command.usage}` : ""}** - ${command.description}`).join("\n") + "\n⠀";
    const formattedClassNames = Object.entries(classNames).map(className => `**${className[0]}**: ${className[1]}`).join("\n")
    message.embed({
      title: "Help",
      fields: [
        {
          name: "The following commands don't require you to register:",
          value: format(unregisteredCommands)
        },
        {
          name: "But, you need to register before using these commands:",
          value: format(registeredCommands)
        },
        {
          name: "Here is a list of the abbreviations of classes which you can use to get their grades, homework, and more:",
          value: "⠀\n" + formattedClassNames
        }
      ]
    });
  }
}