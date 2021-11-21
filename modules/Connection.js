const { WAConnection } = require('@adiwajshing/baileys')
const fs = require('fs')
const ConnectionList = require('./ConnectionList')
const Status = require('./Status')

module.exports = class Connection {
  sessionPath = './sessions/'
  isEventRegistered = false
  attempts = 0

  constructor(number) {
    this.number = number
    this.conn = new WAConnection()
  }

  async connect() {
    if (fs.existsSync(this.getSessionPath())) {
      this.conn.loadAuthInfo(this.getSessionPath())
    }
    this.initEvents()
    await this.conn.connect()
  }

  async disconnect() {
    this.conn.close()
    if (fs.existsSync(this.getSessionPath())) {
      fs.unlinkSync(this.getSessionPath())
    }
    ConnectionList.delete(this.number)
  }

  initEvents() {
    if (!this.isEventRegistered) {
      // Save new credential info.
      this.conn.on('open', () => {
        const authInfo = this.conn.base64EncodedAuthInfo()
        fs.writeFileSync(
          this.getSessionPath(),
          JSON.stringify(authInfo, null, '\t')
        )
        this.qr = ''
      })

      // Get QR code
      this.conn.on('qr', (qr) => {
        this.attempts++
        this.qr = qr
      })

      // Another events...

      this.isEventRegistered = true
    }
  }

  getSessionPath() {
    return this.sessionPath + this.number + '.json'
  }

  getStatus() {
    switch (this.conn.state) {
      case 'open':
        return Status.CONNECTED
      case 'connecting':
        return Status.CONNECTING
      case 'close':
        return Status.NOT_CONNECTED
      default:
        return Status.NOT_CONNECTED
    }
  }

  getQrImageUrl() {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.qr}`
  }
}
