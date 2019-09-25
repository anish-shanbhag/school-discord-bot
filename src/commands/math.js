const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const dayInfo = require("../day-info");

module.exports = {
  name: "math",
  description: "Displays the homework for Mr. Soto's IB Calculus class",
  usesDay: true,
  async: true,
  async execute(message, args, loadingMessage, day) {
    const response = await axios("https://sites.google.com/site/sotomathpage/homework/calculus-ap-ib");
    const $ = cheerio.load(response.data);
    $("td.td-file").each(async (i, el) => {
      if ($(el).find("span.td-value").html().includes("Assignments")) {
        const doc = await axios({
          url: "https://sites.google.com" + $(el).find("span:nth-child(3) > a:nth-child(2)").attr("href"),
          method: "GET",
          responseType: "arraybuffer"
        });
        const parsed = await pdf(Buffer.from(doc.data));
        const matches = [...parsed.text.matchAll(new RegExp(dayInfo["last" + day].format("DD-MMM-YY"), "g"))];
        if (matches.length > 0) {
          if (loadingMessage.deletable) {
            loadingMessage.delete();
          }
          await message.embed({
            title: `IB Calculus ${day} Day Homework`,
            fields: matches.map(match => {
              const slicedText = parsed.text.slice(match.index);
              const section = /\d+\.\d+/.exec(slicedText);
              const testOrQuiz = /Q\d+|T\d+/.exec(slicedText);
              if (section.index < testOrQuiz.index) {
                const assignment = slicedText.match(/P\..*?(P\.)[^\n]*/)[0];
                return {
                  name: section[0],
                  value: assignment.slice(assignment.indexOf("P.", assignment.indexOf("P.") + 1))
                }
              } else return null;
            }).filter(assignment => assignment !== null)
          });
        }
        return false;
      }
    });
  }
}