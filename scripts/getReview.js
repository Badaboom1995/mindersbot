const {Markup, Telegraf} = require("telegraf");
const {getWeekActiveUsers} = require("../helpers/getWeekActiveUsers");
const {makeKeyboard} = require("../helpers/keyboard");
const {sendToAdmins} = require("../helpers/sendToAdmins");
const dayjs = require("dayjs");

const devToken = '5810362749:AAG1ht-EidhSqJ51mVutEpA8GGHtFvc1j0g'
const stageToken = '6130195892:AAFB22x7qbo0wICcuSXffFHSyflc4tYm0b4'
const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);

const getReview = async () => {
    const users = await getWeekActiveUsers()
    users.forEach((user, i) => {
        console.log(i, user.telegram)
        bot.telegram.sendMessage(
            user.chat_id,
            `Небольшой опрос.
Состоялась ли предыдущая встреча?`,
            Markup.inlineKeyboard(makeKeyboard(['Да, встретились!', 'Нет, встретимся позже', 'Не договорились'], 1, `get_review/${dayjs().format('YYYY-MM-DD')}`), {columns: 3})
        ).then(() => {
            bot.telegram.sendMessage('208165379', `Отправил опрос ${user.telegram}`)
            // sendToAdmins(`Отправил опрос ${user.telegram}`, bot)
        })
    })
//             bot.telegram.sendMessage(
//             '208165379',
//             `Небольшой опрос.
// Состоялась ли предыдущая встреча?`,
//             Markup.inlineKeyboard(makeKeyboard(['Да, встретились!', 'Нет, встретимся позже', 'Не договорились'], 1, `get_review/${dayjs().format('YYYY-MM-DD')}`), {columns: 3})
//         )
}

getReview()