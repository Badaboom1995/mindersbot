const {bot} = require("./index");
// one more
const dailyFuncs = async () => {
    await bot.telegram.sendMessage(208165379, 'cron')
}

dailyFuncs()
