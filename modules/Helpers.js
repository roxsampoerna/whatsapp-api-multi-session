const fs = require('fs')
const Connection = require('./Connection')
const ConnectionList = require('./ConnectionList')

module.exports = class Helpers {
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  static fullUrl(req) {
    return req.protocol + '://' + req.get('host')
  }
  static connectAllSessions() {
    fs.readdir('./sessions', (err, files) => {
      files.forEach((file) => {
        const number = file.split('.')[0]
        const conn = new Connection(number)
        ConnectionList.set(number, conn)
        conn.connect()
      })
    })
  }
}
