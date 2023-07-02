const {supabase} = require("../supabase");
    const { Telegraf, Markup, Extra } = require('telegraf');
const {messages, skillsDict, hobbiesDict} = require("../config");
const {removePatternFromString} = require("./removePatternFromString");
// const {bot} = require("../api");
const {makeKeyboard} = require("./keyboard");

const devToken = '5810362749:AAG1ht-EidhSqJ51mVutEpA8GGHtFvc1j0g'
const stageToken = '6130195892:AAFB22x7qbo0wICcuSXffFHSyflc4tYm0b4'
const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);

const getUserFormDB = async (username) => {
    const { data: user, error } = await supabase
        .from('Users')
        .select('*')
        .eq('telegram', username)
        .single()
    return {user, error};
}

const getNames = (str, dict) => {
    return str.split(',').map(item => dict.find(dictItem => dictItem.id === item)?.name).join('\n');
}

const buildProfileHTML = (user) =>
`<b>${user.name ? user.name : 'Имя не указано'}</b>  | ${user.groups?.split(',').map(group => `#${group.trim().split(' ').slice(1).join('')}`).join(' ')}

${user.description ? user.description : 'Описание не указано'}

<b>Навыки</b>:
${user.skills ? getNames(user.skills, skillsDict) : messages.noSkills()}

<b>Увлечения</b>:
${user.hobbies ? getNames(user.hobbies, hobbiesDict) : messages.noHobbies()}

<b>Суперсила</b>: ${user.superpower ? user.superpower : messages.noSuperpower()}

<b>Запросы</b>: ${user.requests ? user.requests : messages.noRequests()}

`


const sendProfileByChatId = async (chatId, user) => {
    await bot.telegram.sendPhoto(chatId, user.profile_photo_url, {
        "reply_markup":{
            "inline_keyboard":[
                [
                    {"text":"Написать собеседнику",url:`https://t.me/${user.telegram}`, "callback_data":"test","hide":false}
                ]
            ]
        },
        caption: buildProfileHTML(user),
        parse_mode: 'HTML'
    })
        // caption: buildProfileHTML(user),

        // parse_mode: 'HTML'

}
const sendProfileWithContext = async (ctx, editable) => {
    const data = await getUserFormDB(ctx.from.username);
    console.log(data)
    const user = data.user || {}
    await ctx.replyWithPhoto(
        user.profile_photo_url || 'https://i.ibb.co/bJ1WYpt/Group-993.jpg',
        {
            // caption: buildProfileHTML(user),
            // parse_mode: 'HTML',
            // "reply_markup":editable ? {
            //     "inline_keyboard":[
            //         [
            //             {"text":"Редактировать", "callback_data":"editProfile_📝 Редактировать","hide":false}
            //         ]
            //     ]
            // } : null,
        }
    );
    await ctx.replyWithHTML(buildProfileHTML(user), {
        "reply_markup":editable ? {
            "inline_keyboard":[
                [
                    {"text":"Редактировать", "callback_data":"editProfile_📝 Редактировать","hide":false}
                ]
            ]
        } : null,
    });
}

module.exports = {getUserFormDB, sendProfile: sendProfileWithContext, sendProfileByChatId}