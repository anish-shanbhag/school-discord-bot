const dayInfo = require("../day-info");

module.exports = {
  name: "last",
  description: "tells you the last school day, or the last [day] (which is 'a' or 'b') if it is included, including the current day",
  usage: "[day]",
  execute(message, args) {
    if (args.length) {
      if (args[0] === "a" || args[0] === "b") {
        message.embed(dayInfo["last" + args[0].toUpperCase()].format("dddd, MMMM DD"));
      } else {
        message.embed("Day must be 'a' or 'b'.");
      }
    } else {
      message.embed(dayInfo.last.date.format("dddd, MMMM DD") + "\n" + dayInfo.last.day + " day");
    }
  }
}