const dayInfo = require("../day-info");
const axios = require("axios");
const cheerio = require("cheerio");
const Discord = require("discord.js");

module.exports = {
  name: "bio",
  description: "displays the homework for Mrs. Harris's IB Biology class",
  usesDay: true,
  async: true,
  hw: true,
  async execute(message, args, loadingMessage, day) {
    const response = await axios({
      url: "http://newburyparkhighschool.net/harris/SecureWebsite/IB1/Agenda_IB1_1.htm",
      auth: {
        username: "NPHS",
        password: "P@nther$!"
      }
    });
    const $ = cheerio.load(response.data);
    let hw;
    $("tbody > tr:nth-child(n + 2)").each((i, row) => {
      if ($(row).find("td:nth-child(1)").text().includes(dayInfo["last" + day].format("M/D"))) {
        hw = $(row).find("td:nth-child(4)");
        return false;
      }
    });
    loadingMessage.delete();
    hw.find("a").each((i, a) => {
      const href = $(a).attr("href").replace(/ /g, "%20");
      $(a).replaceWith(`[${$(a).text()}](${href.startsWith("http") ? href : "http://newburyparkhighschool.net/harris/SecureWebsite/IB1/" + href})`);
    });
    message.embed({
      title: `IB Biology ${day} Day Homework`,
      fields: hw.text().match(/[\s\S]{1,1023}\n/g).map(text => ({
        name: "⠀",
        value: text
      }))
    });
  }
}