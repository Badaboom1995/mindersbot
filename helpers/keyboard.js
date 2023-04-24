const {Markup} = require("telegraf");

const makeKeyboard = (arr, rowLength, prefix) => {
    const keyboard = arr.reduce((acc, curr, index) => {
        const row = Math.floor(index/rowLength);
        if(!acc[row]) acc[row] = [];
        acc[row].push(Markup.button.callback(curr, `${prefix}_${curr}`));
        return acc;
    }, []);
    return keyboard;
}

module.exports = {makeKeyboard}