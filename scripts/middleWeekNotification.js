const {getWeekActiveUsers} = require("../helpers/getWeekActiveUsers");
const {Telegraf} = require("telegraf");

const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);

const middleWeekNotification = async () => {
    const users = await getWeekActiveUsers()
    for(let i = 0; i < users.length; i++) {
        await bot.telegram.sendMessage(users[i].chat_id, `✉️ Уже середина недели.
Напиши своему партнеру Random Coffee, если вдруг забыл(а).`
        )
        console.log(`${i}) send to ${users[i].telegram}|${users[i].chat_id}: ✉️ Уже середина недели.`)
    }
}

middleWeekNotification()