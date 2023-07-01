const {Markup, Telegraf} = require("telegraf");
const {getWeekActiveUsers} = require("../helpers/getWeekActiveUsers");
const {makeKeyboard} = require("../helpers/keyboard");
const {sendToAdmins} = require("../helpers/sendToAdmins");

// const devToken = '6130195892:AAFB22x7qbo0wICcuSXffFHSyflc4tYm0b4'
const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);

const getReview = async (req, res) => {
    const users = await getWeekActiveUsers()
    users.forEach(user => {
        console.log(user.telegram)
        sendToAdmins(`Отправил опрос ${user.telegram}`)
//         bot.telegram.sendMessage(
//             user.chat_id,
//             `Небольшой опрос.
// Состоялась ли предыдущая встреча?`,
//             Markup.inlineKeyboard(makeKeyboard(['Да, встретились!', 'Нет, встретимся позже', 'Не договорились'], 1, 'get_review'), {columns: 3})
//         ).then(() => {
//             sendToAdmins(`Отправил опрос ${user.telegram}`)
//         })
    })
}

getReview()