module.exports = {
  name: "ping",
  description: "pong",
  execute (message) {
    message.embed("pong");
  }
}