const Discord = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const moment = require("moment");
const { CronJob } = require("cron");

const client = new Discord.Client();

const abDays =
  "NNNNNABABANNBABANNNNBABANNBABAB" +
  "NNABABANNBABANNNNBABANNBABABN" +
  "NABABANNBABABNNNABABNNABABANNBA" +
  "BABNNABABNNNNNNNNNNABABANNBABA" +
  "BNNABABANNBABABNNABABNNNNABABNN" +
  "ABABANNBABABNNNNNNNNNNNNNNNNNN" +
  "NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN" +
  "NNNNNNNNNNNNNNNNNNNNABANNBABABN" +
  "NNABABNNABABANNBABABNNABABANNN" +
  "BABANNBANBANNBABABNNABABANNBABA" +
  "NNNBABABNNNABABNNABABANNNNNNNN" +
  "NBABABNNABABANNBABABNNNNNNNNNNN";

let dayInfo = {};

function getDayInfo() {
  const today = moment().dayOfYear();
  dayInfo.today = {
    date: moment(),
    day: abDays[today]
  }
  for (let date = today;; date--) {
    if (date === 1) {
      dayInfo.last = {
        date: moment().dayOfYear(354),
        day: "B"
      }
      break;
    }
    if (abDays[date] !== "N") {
      dayInfo.last = {
        date: moment().dayOfYear(date),
        day: abDays[date]
      }
      break;
    }
  }
  for (let date = today + 1;; date++) {
    if (date === 365) {
      dayInfo.next = {
        date: moment().dayOfYear(6),
        day: "A"
      }
      break;
    }
    if (abDays[date] !== "N") {
      dayInfo.next = {
        date: moment().dayOfYear(date),
        day: abDays[date]
      }
      break;
    }
  }
}

getDayInfo();

new CronJob("0 4 * * *", getDayInfo);

const commands = [
  ["help", "displays the list of commands that you can use"],
  ["today", "tells you the current date and whether it's an A day or a B day"],
  ["last", "tells you the last school day (including the current day) and whether it was an A day or a B day"],
  ["next", "tells you the next school day (after the current day) and whether it will be an A day or a B day"],
  ["hw <teacher>", "tells you the homework assigned from <teacher>"],
  ["ping", "pong"]
].map(command => "**?" + command[0] + "** - " + command[1]).join("\n");

client.on("message", async message => {
  if (message.content.slice(0, 1) === "?") {
    const command = message.content.slice(1).split(" ");
    switch (command[0]) {
      case "help":
        message.channel.send(commands);
        break;
      case "ping":
        message.channel.send("pong");
        break;
      case "today":
        message.channel.send(dayInfo.today.date.format("dddd, MMMM DD") + "\n" +
          (dayInfo.today.day === "N" ? "No school today :)" : (dayInfo.today.day + " day")));
        break;
      case "last":
      case "next":
        message.channel.send(dayInfo[command[0]].date.format("dddd, MMMM DD") + "\n" + dayInfo[command[0]].day + " day");
        break;
      case "hw":
        switch (command[1]) {
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
  }
});

client.login(process.env.BOT_TOKEN);