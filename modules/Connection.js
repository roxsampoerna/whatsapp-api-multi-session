const { WAConnection } = require("@adiwajshing/baileys")
const fs = require("fs")
const ConnectionList = require("./ConnectionList")
const Event = require("./Event")
const Status = require("./Status")

exports.Connection = class {
  eventUrl = "https://run.mocky.io/v3/d8d9ecde-7bfa-4b5d-824f-c2405737965c"
  sessionPath = "./sessions/"
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
    const events = await this.getEvents()
    this.initEvents(events)
    await this.conn.connect()
  }

  async disconnect() {
    this.conn.close()
    if (fs.existsSync(this.getSessionPath())) {
      fs.unlinkSync(this.getSessionPath())
    }
    ConnectionList.delete(this.number)
  }

  initEvents(events = []) {
    if (!this.isEventRegistered) {
      // Save new credential info.
      this.conn.on("open", () => {
        const authInfo = this.conn.base64EncodedAuthInfo()
        fs.writeFileSync(
          this.getSessionPath(),
          JSON.stringify(authInfo, null, "\t")
        )
        this.qr = ""
      })

      // Get QR code
      this.conn.on("qr", (qr) => {
        this.attempts++
        this.qr = qr
      })

      // Custom events
      events.forEach((event) => {
        this.conn.on(event.name, event.callback)
      })

      // Another events...

      this.isEventRegistered = true
    }
  }

  async getEvents() {
    const events = []
    const event = new Event(this.conn, this.eventUrl)
    const chatUpdateEvent = await event.getChatUpdateEvent()
    events.push(chatUpdateEvent)
    return events
  }

  getSessionPath() {
    return this.sessionPath + this.number + ".json"
  }

  getStatus() {
    switch (this.conn.state) {
      case "open":
        return Status.CONNECTED
      case "connecting":
        return Status.CONNECTING
      case "close":
        return Status.NOT_CONNECTED
      default:
        return Status.NOT_CONNECTED
    }
  }

  getQrImageUrl() {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.qr}`
  }
}