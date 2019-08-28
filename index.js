const Discord = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const moment = require("moment");
const {
  CronJob
} = require("cron");

const client = new Discord.Client();

const abDays =
  "nnnnnnnnnnnnnnnnnnnnabannbababn" +
  "nnababnnababannbababnnababannn" +
  "babannbanbannbababnnababannbaba" +
  "nnnbababnnnababnnababannnnnnnn" +
  "nbababnnababannbababnnnnnnnnnnn" +
  "nnnnnababannbabannnnbabannbabab" +
  "nnababannbabannnnbabannbababn" +
  "nababannbababnnnababnnababannba" +
  "babnnababnnnnnnnnnnababannbaba" +
  "bnnababannbababnnababnnnnababnn" +
  "ababannbabab";

function getDay() {
  const date = moment().month(4).date(28);
  const dayOfYear = date.dayOfYear();
  console.log(dayOfYear);
  for (let day = date.month() > 6 ? dayOfYear - 213: dayOfYear + 150;; day--) {
    console.log(day);
    if (day === 151) return "b";
    if (abDays[day] !== "n") return abDays[day];
  }
}

const day = getDay();

console.log(day);

client.on("message", async message => {
  if (message.content.toLowerCase() === "ping") {
    message.channel.send("pong");
  }
  if (message.content.slice(0, 3) === "hw ") {
    switch (message.content.slice(3)) {
      case "test":
        const html = await new pdftohtml("a-b-days.pdf", "a-b-days.html").convert();
        break;
      case "calaba":
        message.channel.send("literally none");
        break;
      case "soto":
        try {
          const response = await axios("https://sites.google.com/site/sotomathpage/homework/calculus-ap-ib");
          const $ = cheerio.load(response.data);
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
              message.channel.send("Error getting homework information :(");
            }
          });
        } catch (e) {
          message.channel.send("Error getting homework information :(");
        }
        break;
      case "harris":
        const response = await axios({
          url: "http://newburyparkhighschool.net/harris/SecureWebsite/IB1/Agenda_IB1_1.htm",
          auth: {
            username: "NPHS",
            password: "P@nther$!"
          }
        });
        const $ = cheerio.load(response.data);
        const hw = $("tbody > tr:nth-child(3) > td:nth-child(4)");
        message.channel.send(hw.text().replace(/    /g, ""));
        const links = hw.find("a");
        if (links.length > 0) {
          message.channel.send(`**Downloading ${links.length} files...**`);
          const docs = await Promise.all(links.get().map(async link => ({
            file: await axios({
              url: "http://newburyparkhighschool.net/harris/SecureWebsite/IB1/" + $(link).attr("href"),
              responseType: "arraybuffer",
              auth: {
                username: "NPHS",
                password: "P@nther$!"
              }
            }),
            name: $(link).html() + ".pdf"
          })));
          docs.forEach(async doc => {
            message.channel.send(new Discord.Attachment(doc.file.data, doc.name));
          });
        }
        break;
    }
  }
});

client.login(process.env.BOT_TOKEN);