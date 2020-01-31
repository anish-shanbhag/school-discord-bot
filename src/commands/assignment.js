const { fullNames } = require("../class-names");
const q = require("../q");
const Fuse = require("fuse.js");
const Discord = require("discord.js");
const watch = require("../watch");

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
    try {
      if (className) {
        const page = await q.full(qInfo.id, qInfo.password);
        const assignments = await page.evaluate(className => {
          for (const table of document.querySelectorAll("#SP_Assignments table")) {
            if (table.querySelector("caption b").innerText.split("(")[0].trim() === className) {
              return [...table.querySelectorAll("tbody > tr")].map(tr => {
                const columns = [...tr.querySelectorAll(":nth-child(4), :nth-child(5), :nth-child(6)")].map(column => column.innerText);
                const graded = tr.querySelector(":nth-child(10) img") === null;
                return {
                  name: columns[0],
                  points: columns[1],
                  score: columns[2],
                  graded
                }
              }).filter(assignment => assignment.name);
            }
          }
        }, className);
        const searchedAssignments = new Fuse(assignments, {
          keys: ["name"],
          threshold: 0.3
        }).search(name);
        const values = searchedAssignments.map((assignment, i) => ({
          number: i + 1,
          name: assignment.name
        }));
        if (values.length === 0) {
          message.embed(`No assignments with were found with the search term "${name}". If you would like to watch for an assignment with that search term, send "watch" to this channel. Otherwise, send "cancel" to cancel getting the assignment.`);
          loadingMessage.delete();
          const filter = response => response.author.id === message.author.id && response.content === "watch" || response.content === "cancel";
          try {
            const response = (await message.channel.awaitMessages(filter, {
              maxMatches: 1,
              time: 30000,
              errors: ["time"]
            })).first();
            if (response.content === "watch") {
              message.embed("Watching for an assignment which matches your search term! When one such assignment has been graded, you will receive a ping from me.");
              watch(name, className, message.author.id, message.channel.id);
            } else {
              message.embed("Cancelled getting assignment.");
              return;
            }
          } catch (e) {
            message.embed("You didn't send your choice in time :(");
          }
          return;
        }
        const firstValue = values.shift();
        await message.embed({
          title: `Here's a list of the assignments found with the search term "${name}":`,
          fields: [{
              name: "Number",
              value: firstValue.number,
              inline: true
            },
            {
              name: "Name",
              value: firstValue.name,
              inline: true
            },
            {
              name: "⠀",
              value: "⠀",
              inline: true
            },
            ...values.map((value, i) => [{
                name: "⠀",
                value: value.number,
                inline: true
              },
              {
                name: "⠀",
                value: value.name,
                inline: true
              },
              {
                name: "⠀",
                value: "⠀",
                inline: true
              }
            ]).flat()
          ]
        });
        await message.embed(`Send the number of the assignment you want to see the grade of to this channel. Or, to cancel, just send "cancel".`);
        const filter = response => response.author.id === message.author.id && ((response.content > 0 && response.content <= searchedAssignments.length) || response.content === "cancel");
        try {
          const response = (await message.channel.awaitMessages(filter, {
            maxMatches: 1,
            time: 30000,
            errors: ["time"]
          })).first();
          if (response.content === "cancel") {
            message.embed("Cancelled getting assignment.");
          } else {
            const assignment = searchedAssignments[response - 1];
            //assignment.graded
            if (false) {
              if (!(message.channel instanceof Discord.DMChannel)) {
                message.embed("A direct message has been sent with your grade!");
              }
              message.author.embed(`Your grade for ${assignment.name} is ${assignment.score}/${assignment.points} (${(assignment.score / assignment.points * 100).toFixed(2)}%)`);
            } else {
              message.embed("Unfortunately, that assignment has not been graded yet. Do you want to set up a watch for it? (yes/no)");
              const filter = response => response.content === "yes" || response.content === "no";
              try {
                const response = (await message.channel.awaitMessages(filter, {
                  maxMatches: 1,
                  time: 30000,
                  errors: ["time"]
                })).first();
                if (response.content === "yes") {
                  message.embed("Watching that assignment. When it has been graded, you will receive a ping from me.");
                  watch(name, className, message.author.id, message.channel.id);
                } else {
                  message.embed("OK, I won't set up a watch for that assignment.")
                }
              } catch (e) {
                message.embed("You didn't send your decision in time :(");
              }
            }
          }
        } catch (e) {
          message.embed("You didn't send the assignment number in time :(");
        }
      } else {
        loadingMessage.delete();
        message.embed("Class not found :(");
      }
    } catch {
      message.embed("An unknown error has occurred (this happens sometimes with this command for no reason, just try again.)");
    }
  }
}