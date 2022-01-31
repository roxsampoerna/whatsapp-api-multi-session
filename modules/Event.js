const { MessageType } = require("@adiwajshing/baileys");
const { default: axios } = require("axios");
const Helpers = require("./Helpers");
const ButtonMessage = require("./ButtonMessage");
require("dotenv").config();

module.exports = class Event {
  constructor(conn, url) {
    this.conn = conn;
    this.url = url;
  }

  async getChatUpdateEvent() {
    const name = "chat-update";
    const { data } = await axios(this.url);
    const { main, greeting } = data;
    return {
      name,
      callback: (chatUpdate) => {
        const { messages } = chatUpdate;
        if (messages && chatUpdate.count) {
          messages.all().forEach((messageInfo) => {
            const jid = messageInfo.key.remoteJid;
            if (
              process.env.NODE_ENV !== "local" ||
              jid !== Helpers.getJid(process.env.TEST_NUMBER)
            ) {
              return;
            }

            const { message } = messageInfo;
            let keyword
            if (message.buttonsResponseMessage) {
              keyword = message.buttonsResponseMessage.selectedDisplayText;
            }

            const matchMessages = main.filter(item => item.title == keyword)
            const buttonMessage = new ButtonMessage()

            if (!matchMessages.length) {
              buttonMessage.messageCaption = greeting.message_caption
              buttonMessage.buttons = greeting.button
            } else {
              const matchMessage = matchMessages[0]
              buttonMessage.messageCaption = matchMessage.message_caption
              buttonMessage.buttons = matchMessage.button
            }

            this.conn.sendMessage(jid, buttonMessage.getInstance(), MessageType.buttonsMessage)
          });
        }
      },
    };
  }
};
