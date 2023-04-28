const {Telegraf, Markup, Scenes, session} = require('telegraf');
const {skills, hobbies}  = require("../data/skills.js");
const {messages} = require("../config");
const {makeKeyboard} = require("../helpers/keyboard");
const {editScene} = require("../scenes/editScene");
const {requestScene} = require("../scenes/requestScene");
const {profileNormalizeScene} = require("../scenes/profileNormalizeScene");
const {getUserFormDB, sendProfile} = require("../helpers/getUserFormDB");
const {sendToAdmins} = require("../helpers/sendToAdmins");
const {supabase} = require("../supabase");
const {wait} = require("../helpers/wait");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: "dgpgmk0w7",
    api_key: "928942683275635",
    api_secret: "p2Zvcv3kPZt0bLNpBbHhSNZXiac"
});

// const devToken = '6130195892:AAFB22x7qbo0wICcuSXffFHSyflc4tYm0b4'
// ddd
const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);

const stage = new Scenes.Stage([editScene, requestScene, profileNormalizeScene]);
bot.use(session());
bot.use(stage.middleware());

bot.telegram.setWebhook('https://minders-match.vercel.app/api/index');

module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).end();
    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
};

const saveChatId = async (ctx) => {
    const {error} = await supabase
        .from('Users')
        .update({ chat_id: ctx.chat.id })
        .eq('telegram', ctx.from.username);

    if (error && ctx.session.id_save_counter < 3) {
        ctx.session.id_save_counter = ctx.session.id_save_counter ? ctx.session.id_save_counter + 1 : 1;
        saveChatId(ctx);
    }
}

bot.start(async (ctx) => {
    saveChatId(ctx);
    ctx.session = {};
    await ctx.reply('👋')
    await ctx.reply(messages.welcome(ctx.from.first_name), Markup.inlineKeyboard(makeKeyboard(['Синхронизировать профиль'], 3, 'sync'), {columns: 3}));
});

bot.action(/sync(.+)/, async (ctx) => {
    // const eyes = await ctx.reply("👀");
    // await wait(200);
    // const searchMsg = await ctx.reply("Ищу в базе данных...");
    const username =  ctx.from.username;
    const chatId = ctx.chat.id;
    const {user, error} = await getUserFormDB(username);
    await ctx.answerCbQuery();
    // await wait(500);
    // await ctx.telegram.deleteMessage(chatId, eyes.message_id);
    // await ctx.telegram.deleteMessage(chatId, searchMsg.message_id);
    // await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');

    ctx.session.user = user;
    if (error) {
        ctx.reply(messages.notFoundProfile());
        const timestamp = new Date().toLocaleString();
        sendToAdmins(`🚨Не нашли пользователя ${ctx.from.username}, ${timestamp}`, bot)
    }
    if (user) {
        await ctx.reply('✅ Нашел');
        if(user.is_updated){
            await sendProfile(ctx, user)
            await ctx.scene.enter('requestScene');
        } else {
            await sendProfile(ctx, user)
            await ctx.reply('Твой профиль? Дозаполнить и изменить можно будет дальше',Markup.inlineKeyboard(makeKeyboard(['Да, мой', 'Не мой'], 3, 'isRight'), {columns: 3}))
        }
    }
})

bot.action(/isRight_(.+)/, async (ctx) => {
    const optionName = ctx.match[1];
    await ctx.answerCbQuery(); // Required to close the loading state on the button
    if(optionName === 'Да, мой') {
        await ctx.reply(`Супер, нужно заполнить еще несколько полей и твой профиль будет готов`);
        await wait(1000);
        await ctx.scene.enter('profileNormalize');
    } else {
        await ctx.reply(`Написал в поддержку, скоро тебе помогут`);
        const timestamp = new Date().toLocaleString();
        await sendToAdmins(`🚨Пользователь ${ctx.from.username} не признал свой профиль, ${timestamp}`, bot)
    }
})

bot.hears('👤 Профиль', async (ctx) => {
    await ctx.reply('Ваш профиль')
    await ctx.reply('Изменить')
});
bot.hears('👥 Пара этой недели', async (ctx) => {
    await ctx.reply('Ваша пара на этой неделе:')
    await ctx.reply('Хотите изменить?')
});
bot.hears('🗣 Запрос', async (ctx) => {
    await ctx.reply('Ваш текущий запрос выглядит так')
    await ctx.reply('Хотите что то изменить?')
});
bot.hears('⏸ Поставить на паузу', async (ctx) => {
    await ctx.reply('Вам не будут приходить оповещения до конца следующей недели')
});

// bot.on('text', async (ctx) => {
//     if(ctx.message.text === '/start') return
//     if(ctx.message.text === 'edit'){
//         await ctx.scene.enter('editProfile');
//     }
//
//     if(ctx.message.text === 'skills') {
//         // reply with inline keyboard of skills
//         ctx.reply('💻Tехнические навыки', Markup.inlineKeyboard(makeKeyboard(skills.tech, 3), {columns: 3}));
//         ctx.reply('💼 Бизнес', Markup.inlineKeyboard(makeKeyboard(skills.business, 3), {columns: 3}));
//         ctx.reply('🎨 Креативность', Markup.inlineKeyboard(makeKeyboard(skills.creative, 3), {columns: 3}));
//         ctx.reply('💜 Софт скилз', Markup.inlineKeyboard(makeKeyboard(skills.soft_skills, 3), {columns: 3}));
//         // ctx.reply('Business skills', Markup.inlineKeyboard(businessKeys));
//     }
//     if(ctx.message.text === 'hobbies') {
//         const hightCategoryKeyboard = Object.keys(hobbies).reduce((acc,key) => {
//             return [...acc, [Markup.button.callback(key, `option_${key}`)]];
//         },[]);
//         ctx.replyWithHTML(`<b><code> Выберите категорию </code></b>`, Markup.inlineKeyboard(hightCategoryKeyboard,{columns:1}));
//     }
// });
//
//
// bot.action(/skill_(.+)/, async (ctx) => {
//     const optionName = ctx.match[1];
//     await ctx.answerCbQuery(); // Required to close the loading state on the button
//     await ctx.replyWithHTML(`<b>${optionName}</b> skill has been added to your profile`);
// })
// bot.action(/option_(.+)/, async (ctx) => {
//     const optionName = ctx.match[1];
//     await ctx.answerCbQuery(); // Required to close the loading state on the button
//     await ctx.replyWithHTML(`<b>${optionName}</b> skill has been added to your profile`);
// })


// bot.launch();
// console.log('bot started');
