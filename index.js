const Discord = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const moment = require("moment");
const { CronJob } = require("cron");
const puppeteer = require("puppeteer");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const auth = process.env.DEV ? require("./auth.json") : null;
const mysql = require("serverless-mysql")({
  config: {
    host: "remotemysql.com",
    database: "k2nadU14ft",
    user: "k2nadU14ft",
    password: process.env.DEV ? auth.DATABASE_PASSWORD : process.env.DATABASE_PASSWORD
  }
});

const client = new Discord.Client();

moment.tz.setDefault("America/Los_Angeles")

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
  dayInfo = {};
  const today = moment().hour(0);
  dayInfo.today = {
    date: today,
    day: abDays[today.dayOfYear()]
  }
  for (let date = today.dayOfYear();; date--) {
    if (dayInfo.last && dayInfo.lastA && dayInfo.lastB) break;
    if (date === 1) {
      dayInfo.last = {
        date: moment("12 20 0", "M D H"),
        day: "B"
      }
      dayInfo.lastA = moment("12 19 0", "M D H");
      dayInfo.lastB = moment("12 20 0", "M D H");
    }
    if (abDays[date] !== "N") {
      if (!dayInfo.last) {
        dayInfo.last = {
          date: moment(date + " 0", "DDD H"),
          day: abDays[date]
        }
      }
      dayInfo["last" + abDays[date]] = moment(date + " 0", "DDD H");
    }
  }
  for (let date = today.dayOfYear() + 1;; date++) {
    if (dayInfo.next && dayInfo.nextA && dayInfo.nextB) break;
    if (date === 365) {
      dayInfo.next = {
        date: moment("1 6 0", "M D H"),
        day: "A"
      }
      dayInfo.nextA = moment("1 6 0", "M D H");
      dayInfo.nextB = moment("1 7 0", "M D H");
    }
    if (abDays[date] !== "N") {
      if (!dayInfo.next) {
        dayInfo.next = {
          date: moment(date + " 0", "DDD H"),
          day: abDays[date]
        }
      }
      dayInfo["next" + abDays[date]] = moment(date + " 0", "DDD H");
    }
  }
}

getDayInfo();

const job = new CronJob({
  cronTime: "0 2 * * *",
  onTick: getDayInfo,
  timeZone: "America/Los_Angeles"
});

job.start();

const commands = [
  ["help", "displays the list of commands that you can use"],
  ["today", "tells you the current date and whether it's an A day or a B day"],
  ["last", "tells you the last school day (including the current day) and whether it was an A day or a B day"],
  ["last a", "tells you the last A day (including the current day)"],
  ["last b", "tells you the last B day (including the current day)"],
  ["next", "tells you the next school day (after the current day) and whether it will be an A day or a B day"],
  ["next a", "tells you the next A day (after the current day)"],
  ["next b", "tells you the next B day (after the current day)"],
  ["hw <teacher>", "tells you the homework assigned from <teacher>"],
  ["ping", "pong"]
].map(command => "**?" + command[0] + "** - " + command[1]).join("\n");

const classNames = {
  "IB Math: Calculus": "math",
  "IB English A: Lang & Lit 1": "english",
  "IB Biology 1": "biology",
  "IB History of the Americas": "hoa",
  "IB Spanish B1": "spanish",
  "IB Philosophy": "philosophy"
}

client.on("message", async message => {
  if (!process.env.DEV && message.guild.id !== "614245363498483712" || process.env.DEV && message.guild.id === "614245363498483712") {
    if (message.content.slice(0, 1) === "?") {
      const command = message.content.slice(1).split(" ");
      switch (command[0]) {
        case "help":
          message.channel.send(commands);
          break;
        case "register":
          message.delete();
          const loadingMessage = await message.channel.send("**Loading...**");
          mysql.query("SELECT * FROM student", (error, results) => {
            if (results.every(student => !bcrypt.compareSync(message.author.id, student.id))) {
              bcrypt.hash(message.author.id, 10, async (error, hash) => {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto('https://conejo.vcoe.org/studentconnect/');
                await page.waitFor("#loginlist > tbody > tr:nth-child(10) > td > a");
                await page.click("#loginlist > tbody > tr:nth-child(10) > td > a");
                await page.waitFor("#page");
                await page.type("#Pin", command[1]);
                await page.type("#Password", command[2]);
                await page.click("#LoginButton");
                const result = await page.waitFor(".sturow, #msgdisplay:not([style*='display'])");
                if (result._remoteObject.description === "div#msgdisplay") {
                  message.channel.send("Registration failed - your login information is incorrect.")
                } else {
                  await page.waitFor(200);
                  await page.click(".sturow");
                  await page.waitFor("#SP_Detail");
                  await page.waitFor(() => !document.querySelector("#waitdiv"));
                  const classes = await page.evaluate(() => {
                    return [...document.querySelectorAll("#SP-Schedule > tbody > tr")]
                      .map(row => ({
                        name: row.querySelector(":nth-child(6)").innerText,
                        teacher: row.querySelector(":nth-child(7) > a").innerText.split(",")[0].toLowerCase(),
                        period: row.querySelector(":nth-child(2)").innerText + row.querySelector(":nth-child(3)").innerText
                      }));
                  });
                  const encryptedID = CryptoJS.AES.encrypt(command[1], hash).toString();
                  const encryptedPassword = CryptoJS.AES.encrypt(command[2], hash).toString();
                  await mysql.query("INSERT INTO `student` VALUES (?, ?, ?)", [hash, encryptedID, encryptedPassword]);
                  const classValues = classes.map(clazz => [classNames[clazz.name] || clazz.name, hash, clazz.teacher, clazz.period]).flat();
                  await mysql.query("INSERT INTO `class` VALUES " + new Array(classes.length).fill("(?, ?, ?, ?)").join(", "), classValues);
                }
                await browser.close();
                loadingMessage.delete();
              });
            } else {
              message.channel.send(`It looks like you've already registered.`);
              loadingMessage.delete();
            }
          });
          return;
        case "ping":
          message.channel.send("pong");
          break;
        case "today":
          message.channel.send(dayInfo.today.date.format("dddd, MMMM DD") + "\n" +
            (dayInfo.today.day === "N" ? "No school today :)" : (dayInfo.today.day + " day")));
          break;
        case "last":
        case "next":
          if (command[1] === "a" || command[1] == "b") {
            message.channel.send(dayInfo[command[0] + command[1].toUpperCase()].format("dddd, MMMM DD"));
          } else {
            message.channel.send(dayInfo[command[0]].date.format("dddd, MMMM DD") + "\n" + dayInfo[command[0]].day + " day")
          }
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
                      const matches = [...parsed.text.matchAll(new RegExp(dayInfo.lastA.format("DD-MMM-YY"), "g"))]
                      matches.forEach(match => {
                        const slicedText = parsed.text.slice(match.index);
                        const section = slicedText.match(/\d+\.\d+/)[0];
                        const assignment = slicedText.match(/P\..*?(P\.)[^\n]*/)[0];
                        const problems = assignment.slice(assignment.indexOf("P.", assignment.indexOf("P.") + 1));
                        message.channel.send(`**${section}** ${problems}`);
                      });
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
            default:
              message.channel.send("I don't know who that teacher is :(");
          }
          break;
        default:
          message.channel.send("I don't recognize that command :(");
      }
    }
  }
});

client.login(process.env.DEV ? auth.BOT_TOKEN : process.env.BOT_TOKEN);