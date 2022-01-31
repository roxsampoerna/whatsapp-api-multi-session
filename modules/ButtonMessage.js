module.exports = class ButtonMessage {
  footerText = "Klik tombol di bawah";

  constructor(messageCaption = "", buttons = []) {
    this.messageCaption = messageCaption;
    this.buttons = buttons;
  }

  getInstance() {
    return {
      contentText: this.messageCaption,
      footerText: this.footerText,
      buttons: this.getButtons(),
      headerType: 1,
    };
  }

  getButtons() {
    return this.buttons.map((button, index) => ({
      buttonId: "btn" + index,
      buttonText: {
        displayText: button,
      },
      type: 1,
    }));
  }
};
