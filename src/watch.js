const mysql = require("./db");
const q = require("./q");
const client = require("./index");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");
const Fuse = require("fuse.js");
const Discord = require("discord.js");

const watching = [];

function addAssignment(assignment) {
  const userAssignments = watching[watching.map(assignments => assignments[0].user).indexOf(assignment.user)];
  if (userAssignments) {
    userAssignments.push(assignment);
  } else {
    watching.push([assignment]);
    watching.sort((assignments1, assignments2) => assignments1[0].user - assignments2[0].user);
  }
}
function stopWatching(assignment) {
  watching.splice(watching.indexOf(assignment), 1);
  mysql.query("DELETE FROM watch WHERE user = ? AND name = ?", [assignment.user, assignment.name])
}
(async function checkWatching() {
  //console.log(watching.length);
  for (const assignments of watching) {
    let id, password;
    for (const student of await mysql.query("SELECT * FROM student")) {
      if (bcrypt.compareSync(assignments[0].user, student.id)) {
          id = CryptoJS.AES.decrypt(student.q_id, assignments[0].user).toString(CryptoJS.enc.Utf8);
          password = CryptoJS.AES.decrypt(student.q_password, assignments[0].user).toString(CryptoJS.enc.Utf8);
        break;
      }
    }
    const page = await q.full(id, password);
    for (const assignment of assignments) {
      const assignments = await page.evaluate(clazz => {
        for (const table of document.querySelectorAll("#SP_Assignments table")) {
          if (table.querySelector("caption b").innerText.split("(")[0].trim() === clazz) {
            return [...table.querySelectorAll("tbody > tr")].map(tr => {
              const columns = [...tr.querySelectorAll(":nth-child(4), :nth-child(5), :nth-child(6)")].map(column => column.innerText);
              const graded = tr.querySelector(":nth-child(10) img") === null;
              if (graded) {
                return {
                  name: columns[0],
                  points: columns[1],
                  score: columns[2],
                }
              } else return null;
            }).filter(assignment => assignment && assignment.name);
          }
        }
        return document.querySelectorAll("#SP_Assignments table").map(table => table.querySelector("caption b").innerText.split("(")[0].trim());
      }, assignment.clazz);
      //console.log(assignments);
      const searchedAssignments = new Fuse(assignments, {
        keys: ["name"],
        threshold: 0.3
      }).search(assignment.name);
      const values = searchedAssignments.map((assignment, i) => ({
        number: i + 1,
        ...assignment
      }));
      if (values.length > 0) {
        const firstValue = values.shift();
        const channel = await client.channels.get(assignment.channel);
        //console.log(assignment.channel);
        const user = await client.users.get(assignment.user);
        await channel.send(user.toString());
        channel.embed({
          title: `I've found assignments which match the watch you set up! Here's a list of the assignments found with the search term "${assignment.name}":`,
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
            ...values.map(value => [{
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
        channel.embed(`Send the number of the assignment you want to see the grade of to this channel. To cancel, just send "cancel". To end this watch, send "end".`);
        const filter = response => response.author.id === assignment.user && ((response.content > 0 && response.content <= searchedAssignments.length) || response.content === "cancel" || response.content === "end");
        try {
          const response = (await channel.awaitMessages(filter, {
            maxMatches: 1,
            time: 30000,
            errors: ["time"]
          })).first();
          if (response.content === "cancel") {
            channel.embed("Cancelled getting assignment.");
          } else if (response.content === "end") {
            channel.embed(`Ended the watch for an assignment matching the search term "${assignment.name}".`);
            stopWatching(assignment);
          } else {
            const qAssignment = searchedAssignments[response - 1];
            if (!(channel instanceof Discord.DMChannel)) {
              channel.embed("A direct message has been sent with your grade!");
            }
            user.embed(`Your grade for ${qAssignment.name} is ${qAssignment.score}/${qAssignment.points} (${(qAssignment.score / qAssignment.points * 100).toFixed(2)}%)`);
            user.embed(`Ended the watch for an assignment matching the search term "${qAssignment.name}".`)
            stopWatching(assignment);
          }
        } catch (e) {
          channel.embed("You didn't send the assignment number in time :(");
        }
      }
    }
  }
  setTimeout(checkWatching, 0);
})();

(async () => {
  (await mysql.query("SELECT * FROM watch")).forEach(addAssignment);
})();

module.exports = (name, clazz, user, channel) => {
  if (!watching.map(assignments => assignments.map(assignment => assignment.name)).flat().includes(name) &&
    !watching.map(assignments => assignments.map(assignment => assignment.user)).flat().includes(user)) {
    addAssignment({ name, clazz, user, channel });
  }
  mysql.query("INSERT INTO watch VALUES (?, ?, ?, ?)", [name, clazz, user, channel]);
}