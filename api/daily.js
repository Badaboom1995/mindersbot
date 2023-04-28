const {Telegraf} = require("telegraf");

const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);
const dailyFuncs = async () => {
    await bot.telegram.sendMessage(208165379, 'cron')
    console.log('cron works')
}
module.exports = async (req, res) => {
    try {
        dailyFuncs()
        res.status(200).send('Cron job executed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



