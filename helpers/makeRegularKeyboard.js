const { Markup } = require('telegraf');

function createKeyboard(options) {
    const { keys, rows } = options;
    const buttons = keys.map((key) => Markup.button.text(key));
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += rows) {
        keyboard.push(buttons.slice(i, i + rows));
    }
    return Markup.keyboard(keyboard).resize();
}

module.exports = {createKeyboard}