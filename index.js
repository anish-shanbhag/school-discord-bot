const { Client } = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");

const client = new Client();

client.on("message", async message => {
  if (message.content.slice(0, 3) == "hw ") {
    switch (message.content.slice(3)) {
      case "soto":
        try {
          const response = await axios.get("https://sites.google.com/site/sotomathpage/homework/calculus-ap-ib");
          const $ = cheerio.load(response.data);
          let link;
          $("td.td-file").each(async (i, el) => {
            try {
              if ($(el).find("span.td-value").html().includes("Assignments")) {
                console.log("sites.google.com" + $(el).find("span:nth-child(3) > a:nth-child(2)").attr("href"));
                const doc = await axios({
                  url: "https://jsonplaceholder.typicode.com/todos/1",
                  method: "GET",
                  responseType: "blob"
                });
                //const doc  = await axios.get("sites.google.com" + $(el).find("span:nth-child(3) > a:nth-child(2)").attr("href"));
                //const a = await pdf("sites.google.com" + $(el).find("span:nth-child(3) > a:nth-child(2)").attr("href"));
                console.log(doc);
                return false;
              }
            }
            catch (e) {
              console.log(e);
            }
          });
        } catch (e) {
          message.channel.send(e + "Error getting homework information :(");
        }
    }
  }
});

client.login(process.env.BOT_TOKEN);