const {bot} = require("./index");
// one more
const dailyFuncs = async () => {
    await bot.telegram.sendMessage(208165379, 'cron')
    console.log('cron works')
}
console.log('cron works outside')
dailyFuncs()
