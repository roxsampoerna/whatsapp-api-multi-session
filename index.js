require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const fs = require('fs')
const Connection = require('./modules/Connection')
const ConnectionList = require('./modules/ConnectionList')
const Helpers = require('./modules/Helpers')
const Status = require('./modules/Status')
const bodyParser = require('body-parser')
const { MessageType } = require('@adiwajshing/baileys')
const QRCode = require('qrcode')
const { PassThrough } = require('stream')

app.use(bodyParser.json())

Helpers.connectAllSessions()

app.get('/status/:number', async (req, res) => {
  const { number } = req.params
  const sessionPath = `./sessions/${number}.json`

  if (!ConnectionList.get(number)) {
    ConnectionList.set(number, new Connection(number))
  }
  const connection = ConnectionList.get(number)
  res.json({
    message: 'Connection status retrieved.',
    status: connection.getStatus()
  })
})

app.get('/connect/:number', async (req, res) => {
  const { number } = req.params

  if (!ConnectionList.get(number)) {
    ConnectionList.set(number, new Connection(number))
  }

  const conn = ConnectionList.get(number)

  if (conn.getStatus() != Status.NOT_CONNECTED) {
    return res.json({
      message: `WhatsApp is ${conn.getStatus().toLowerCase()}.`
    })
  }

  conn.connect()

  while (!conn.qr) {
    console.log('Waiting for QR code...')
    await Helpers.sleep(500)
  }

  res.json({
    attempts: conn.attempts,
    qr: conn.qr,
    qrImage: conn.getQrImageUrl(),
    freshQrUrl: Helpers.fullUrl(req) + '/qr/' + number
  })
})

app.get('/disconnect/:number', async (req, res) => {
  const { number } = req.params
  const conn = ConnectionList.get(number)

  if (!conn) {
    return res.json({ message: 'WhatsApp is disconnected.' })
  }

  await conn.disconnect()

  res.json({
    message: 'WhatsApp is disconnected.'
  })
})

app.get('/qr/:number', async (req, res) => {
  const { number } = req.params
  const conn = ConnectionList.get(number)
  if (!conn) {
    res.json({
      message: 'WhatsApp is not connected.'
    })
  } else if (conn.getStatus() == Status.CONNECTED) {
    res.json({
      message: 'WhatsApp is connected.'
    })
  } else {
    res.json({
      message: 'WhatsApp QR retrieved.',
      qr: conn.qr,
      qrImage: conn.getQrImageUrl(),
      attempts: conn.attempts
    })
  }
})

app.get('/qr-image/:number', async (req, res) => {
  const { number } = req.params
  const conn = ConnectionList.get(number)
  if (!conn) {
    res.json({
      message: 'WhatsApp is not connected.'
    })
  } else if (conn.getStatus() == Status.CONNECTED) {
    res.json({
      message: 'WhatsApp is connected.'
    })
  } else {
    try {
      const qrStream = new PassThrough()
      const result = await QRCode.toFileStream(qrStream, conn.qr, {
        type: 'png',
        width: 500,
        errorCorrectionLevel: 'H'
      })
  
      qrStream.pipe(res)
    } catch (err) {
      console.error('Failed to return content', err)
      return res.status(404);
    }
  } 
})

app.post('/send/:number', async (req, res) => {
  try {
    const { number } = req.params
    const conn = ConnectionList.get(number)

    if (!conn) {
      return res.json({
        message: 'WhatsApp is not connected.'
      })
    }

    if (conn.getStatus() != Status.CONNECTED) {
      return res.json({
        message: `WhatsApp is ${conn.getStatus().toLowerCase()}`
      })
    }

    const { message, numbers, image } = req.body
    if (!message || !numbers)
      throw { message: 'Message and numbers are required.' }

    if (!numbers.length) throw { message: 'Numbers are required' }

    numbers.forEach((number) => {
      const jid = number + '@s.whatsapp.net'
      if (image) {
        conn.conn.sendMessage(jid, { url: image }, MessageType.image, {
          caption: message
        })
      } else {
        conn.conn.sendMessage(jid, message, MessageType.text)
      }
    })

    return res.json({
      message: 'Message sent successfully.'
    })
  } catch (e) {
    return res
      .json({
        message: `Failed to send message. ${e.message}`
      })
      .status(500)
  }
})

app.listen(port, () => {
  console.log('App is running at port ' + port)
})
