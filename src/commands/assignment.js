const { fullNames } = require("../class-names");
const q = require("../q");
const Fuse = require("fuse.js");

module.exports = {
  name: "assignment",
  description: "Sends you a direct message containing your grade for the assignment called <name> in <class>",
  usage: "<class> <name>",
  async: true,
  usesQ: true,
  async execute(message, args, loadingMessage, qInfo) {
    const [abbreviation, ...splitName] = args;
    const className = fullNames[abbreviation];
    const name = splitName.join(" ");
    if (className) {
      const page = await q.full(qInfo.id, qInfo.password);
      const assignments = await page.evaluate(className => {
        for (const table of document.querySelectorAll("#SP_Assignments table")) {
          if (table.querySelector("caption b").innerText.split("(")[0].trim() === className) {
            return [...table.querySelectorAll("tbody tr")].map(tr => {
              const columns = [...tr.querySelectorAll(":nth-child(4), :nth-child(5), :nth-child(6)")].map(column => column.innerText);
              const graded = tr.querySelector(":nth-child(10) img") === null;
              return {
                name: columns[0],
                points: columns[1],
                score: columns[2],
                graded
              }
            });
          }
        }
      }, className);
      console.log(assignments);
    } else {
      loadingMessage.delete();
      message.embed("Class not found :(")
    }
  }
}