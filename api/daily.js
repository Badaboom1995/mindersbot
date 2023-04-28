const {Telegraf} = require("telegraf");

const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);

module.exports = async (req, res) => {
    try {
        // Your request handling logic here
        res.status(200).send('Cron job executed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const dailyFuncs = async () => {
    await bot.telegram.sendMessage(208165379, 'cron')
    console.log('cron works')
}

console.log('cron works outside')
dailyFuncs()


