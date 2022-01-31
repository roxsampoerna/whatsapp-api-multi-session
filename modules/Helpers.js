const fs = require("fs");
const ConnectionList = require("./ConnectionList");
const Connection = require("./Connection.js");

module.exports = class Helpers {
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  static fullUrl(req) {
    return req.protocol + "://" + req.get("host");
  }
  static connectAllSessions() {
    fs.readdir("./sessions", (err, files) => {
      files.forEach((file) => {
        const number = file.split(".")[0];
        const conn = new Connection.Connection(number);
        ConnectionList.set(number, conn);
        conn.connect();
      });
    });
  }
  static getJid(number) {
    return number + "@s.whatsapp.net"
  }
};
