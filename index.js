const { Client } = require("discord.js");
const client = new Client();

client.on("message", message => {
  if (message.substring(0, 3) == "hw ") {
    const cmd = message.substring(3, -1);
    message.channel.send(cmd);
  }
});

client.login(process.env.BOT_TOKEN);