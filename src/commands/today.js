const dayInfo = require("../day-info");

module.exports = {
  name: "today",
  description: "tells you the current date and whether it's an A day or a B day",
  execute(message) {
    message.embed(dayInfo.today.date.format("dddd, MMMM DD") + "\n" +
      (dayInfo.today.day === "N" ? "No school today :)" : (dayInfo.today.day + " day")));
  }
}