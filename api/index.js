const {Telegraf, Markup, Scenes, session} = require('telegraf');
const {skills, hobbies}  = require("../data/skills.js");
const {collectHobbies} = require("../helpers/gpt");
const {messages} = require("../config");
const {makeKeyboard} = require("../helpers/keyboard");
const {editScene} = require("../scenes/editScene");
const {requestScene} = require("../scenes/requestScene");
const {profileNormalizeScene} = require("../scenes/profileNormalizeScene");
const {getUserFormDB, sendProfile} = require("../helpers/getUserFormDB");
const {sendToAdmins} = require("../helpers/sendToAdmins");
const {supabase} = require("../supabase");
const cloudinary = require('cloudinary').v2;


cloudinary.config({
    cloud_name: "dgpgmk0w7",
    api_key: "928942683275635",
    api_secret: "p2Zvcv3kPZt0bLNpBbHhSNZXiac"
});


const bot = new Telegraf('5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ');

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

// const techKeys = skills.tech.reduce((acc, curr) => {
//     const row = Math.floor(acc.length/3);
//     if(!acc[row]) acc[row] = [];
//     acc[row].push(Markup.button.callback(curr, `skill_${curr}`));
//     return acc;
// }, []);
//
// const businessKeys = skills.business.map((skill, index) => {
//     return Markup.button.callback(skill, `skill_${skill}`)
// });
//write a regex for this skill_${skill}

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
    ctx.session = {};
    saveChatId(ctx);
    const username =  ctx.from.username;
    ctx.reply(messages.welcome(ctx.from.first_name));
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    const {user, error} = await getUserFormDB(username);
    ctx.session.user = user;
    if (error) {
        ctx.reply(messages.notFoundProfile());
        const timestamp = new Date().toLocaleString();
        sendToAdmins(`🚨Не нашли пользователя ${ctx.from.username}, ${timestamp}`, bot)
    }
    if (user) {
        if(user.is_updated){
            await ctx.reply("Нашел! Похоже с твоим профилем уже все в порядке. Если хочешь что-то поменять, напиши /edit");
            await sendProfile(ctx, user)
            await ctx.scene.enter('requestScene');
        } else {
            await sendProfile(ctx, user)
            await ctx.reply('Твой профиль? Дозаполнить можно будет дальше',Markup.inlineKeyboard(makeKeyboard(['Да, мой', 'Не мой'], 3, 'isRight'), {columns: 3}))
        }
    }
});

bot.action(/isRight_(.+)/, async (ctx) => {
    const optionName = ctx.match[1];
    await ctx.answerCbQuery(); // Required to close the loading state on the button
    if(optionName === 'Да, мой') {
        await ctx.reply(`Отлично! Тогда поехали дальше`);
        await ctx.scene.enter('profileNormalize');
    } else {
        await ctx.reply(`Написал в поддержку, скоро тебе помогут`);
        // add timestamp to string
        const timestamp = new Date().toLocaleString();
        sendToAdmins(`🚨Пользователь ${ctx.from.username} не признал свой профиль, ${timestamp}`, bot)
        // await ctx.scene.enter('editProfile');
    }
})

bot.command('show_typing', async (ctx) => {
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    ctx.reply('Here is the message after typing...');
});

const searchSuggestions = async (query) => {
    // Replace this with your actual search logic
    const suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
    return suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
};
bot.on('text', async (ctx) => {
    // ctx.reply('Please choose an option:', inlineKeyboard);
    if(ctx.message.text === '/start') return
    if(ctx.message.text === 'edit'){
        await ctx.scene.enter('editProfile');
    }

    if(ctx.message.text === 'skills') {
        // reply with inline keyboard of skills
        ctx.reply('💻Tехнические навыки', Markup.inlineKeyboard(makeKeyboard(skills.tech, 3), {columns: 3}));
        ctx.reply('💼 Бизнес', Markup.inlineKeyboard(makeKeyboard(skills.business, 3), {columns: 3}));
        ctx.reply('🎨 Креативность', Markup.inlineKeyboard(makeKeyboard(skills.creative, 3), {columns: 3}));
        ctx.reply('💜 Софт скилз', Markup.inlineKeyboard(makeKeyboard(skills.soft_skills, 3), {columns: 3}));
        // ctx.reply('Business skills', Markup.inlineKeyboard(businessKeys));
    }
    if(ctx.message.text === 'hobbies') {
        const hightCategoryKeyboard = Object.keys(hobbies).reduce((acc,key) => {
            return [...acc, [Markup.button.callback(key, `option_${key}`)]];
        },[]);
        ctx.replyWithHTML(`<b><code> Выберите категорию </code></b>`, Markup.inlineKeyboard(hightCategoryKeyboard,{columns:1}));
        // reply with inline keyboard of skills
        for (const [key, value] of Object.entries(hobbies)) {
            // ctx.replyWithHTML(`<h1>${key}</h1>`)
            // reply with keyboard and html title
            // ctx.replyWithHTML(`<b><code>> ${key} </code></b>`, Markup.inlineKeyboard(makeKeyboard(value, 3), {columns: 3}));

        }
        // ctx.reply('Спорт', Markup.inlineKeyboard(makeKeyboard(hobbies.sport, 3), {columns: 3}));
        // ctx.reply('Автомобили', Markup.inlineKeyboard(makeKeyboard(hobbies.auto, 3), {columns: 3}));
        // ctx.reply('Рукоделие', Markup.inlineKeyboard(makeKeyboard(hobbies.diy, 3), {columns: 3}));
        // ctx.reply('Настольные игры', Markup.inlineKeyboard(makeKeyboard(hobbies.games, 3), {columns: 3}));
        // ctx.reply('Культура', Markup.inlineKeyboard(makeKeyboard(hobbies.culture, 3), {columns: 3}));

        // ctx.reply('Business skills', Markup.inlineKeyboard(businessKeys));

    }
    // ctx.reply(ctx.message.text);
});


bot.action(/skill_(.+)/, async (ctx) => {
    const optionName = ctx.match[1];
    await ctx.answerCbQuery(); // Required to close the loading state on the button
    await ctx.replyWithHTML(`<b>${optionName}</b> skill has been added to your profile`);
})
bot.action(/option_(.+)/, async (ctx) => {
    const optionName = ctx.match[1];
    await ctx.answerCbQuery(); // Required to close the loading state on the button
    await ctx.replyWithHTML(`<b>${optionName}</b> skill has been added to your profile`);
})


bot.launch();
console.log('bot started');
