const {
  Client
} = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const moment = require("moment");

const client = new Client();

client.on("message", async message => {
  if (message.content.slice(0, 3) == "hw ") {
    switch (message.content.slice(3)) {
      case "soto":
        try {
          const response = await axios("https://sites.google.com/site/sotomathpage/homework/calculus-ap-ib");
          const $ = cheerio.load(response.data);
          let link;
          $("td.td-file").each(async (i, el) => {
            try {
              if ($(el).find("span.td-value").html().includes("Assignments")) {
                const doc = await axios({
                  url: "https://sites.google.com" + $(el).find("span:nth-child(3) > a:nth-child(2)").attr("href"),
                  method: "GET",
                  responseType: "arraybuffer"
                });
                const parsed = await pdf(Buffer.from(doc.data));
                const text = parsed.text;
                const matches = [...text.matchAll(/(\d{2})-(\w{3})-(\d{2})/g)];
                let mostRecent = moment(matches[0][0], "DD-MMM-YYYY");
                const indices = [matches[0].index];
                matches.forEach(match => {
                  const dateMoment = moment(match[0], "DD-MMM-YYYY");
                  if (dateMoment.isBefore(moment()) && dateMoment.isAfter(mostRecent)) {
                    mostRecent = dateMoment;
                    indices.length = 0;
                  }
                  if (dateMoment.isSame(mostRecent)) {
                    indices.push(match.index);
                  }
                });
                indices.forEach(index => {
                  const slicedText = text.slice(index);
                  const section = slicedText.match(/\d+\.\d+/)[0];
                  const assignment = slicedText.match(/P\..*?(P\.)[^\n]*/)[0];
                  const problems = assignment.slice(assignment.indexOf("P.", assignment.indexOf("P.") + 1));
                  message.channel.send(`**${section}** ${problems}`);
                })
              }
            } catch (e) {
              message.channel.send(e + "Error getting homework information :(");
            }
          });
        } catch (e) {
          console.log(e);
        }
    }
  }
});

client.login(process.env.BOT_TOKEN);