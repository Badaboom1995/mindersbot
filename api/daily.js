const { Telegraf } = require("telegraf");
const dayjs = require('dayjs');
const weekOfYear = require("dayjs/plugin/weekOfYear");
const weekday = require("dayjs/plugin/weekday");
dayjs.extend(weekOfYear)
dayjs.extend(weekday)

const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ';
const bot = new Telegraf(prodToken);

const dailyFuncs = async () => {
    try {
        const todayWeekday = dayjs().weekday();
        console.log(todayWeekday)
        // await bot.telegram.sendMessage(208165379, todayWeekday);
        console.log('cron works');
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
 dailyFuncs();
module.exports = async (req, res) => {
    try {
        await dailyFuncs();
        res.status(200).send('Cron job executed successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};