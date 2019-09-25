const moment = require("moment");
const { CronJob } = require("cron");

moment.tz.setDefault("America/Los_Angeles");

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

module.exports = dayInfo;