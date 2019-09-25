const dayInfo = require("../day-info");

module.exports = {
  name: "next",
  description: "tells you the next school day, or the next [day] (which is 'a' or 'b') if it is included, after today",
  usage: "[day]",
  execute(message, args) {
    if (args.length) {
      if (args[0] === "a" || args[0] === "b") {
        message.embed(dayInfo["next" + args[0].toUpperCase()].format("dddd, MMMM DD"));
      } else {
        message.embed("Day must be 'a' or 'b'.");
      }
    } else {
      message.embed(dayInfo.next.date.format("dddd, MMMM DD") + "\n" + dayInfo.next.day + " day");
    }
  }
}