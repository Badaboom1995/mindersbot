const {Telegraf, Markup, Scenes, session} = require('telegraf');
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
const express = require('express');
const {init, track} = require("@amplitude/analytics-node");
const dayjs = require("dayjs");
const weekOfYear = require("dayjs/plugin/weekOfYear");
const weekday = require("dayjs/plugin/weekday");

try {
    const app = express();
    const { init, track } = require('@amplitude/analytics-node');

    init('fc185899af59f00b16d189f6bae75ad');

    const dayjs = require('dayjs');
    const weekOfYear = require("dayjs/plugin/weekOfYear");
    const weekday = require("dayjs/plugin/weekday");
    dayjs.extend(weekOfYear)
    dayjs.extend(weekday)

    cloudinary.config({
        cloud_name: "dgpgmk0w7",
        api_key: "928942683275635",
        api_secret: "p2Zvcv3kPZt0bLNpBbHhSNZXiac"
    });

    // const devToken = '5810362749:AAG1ht-EidhSqJ51mVutEpA8GGHtFvc1j0g'
    const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
    const bot = new Telegraf(prodToken);

    const stage = new Scenes.Stage([editScene, requestScene, profileNormalizeScene]);
    bot.use(session());
    bot.use(stage.middleware());

    module.exports = async (req, res) => {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).end();
        } catch (error) {
            console.error(error);
            res.status(500).end();
        }
    };

    const updatePairInSupabase = async (user, impression, pairDate) => {
        const dayStart = dayjs(pairDate).format()
        const dayEnd = dayjs(pairDate).add(1,'day').format()
        try {
            const { data, error } = await supabase
                .from('Pairs')
                .select('*')
                .or(`user.eq.${user}, partner.eq.${user}`)
                .gt('Created', dayStart)
                .lt('Created', dayEnd)
                .single()

            if(error) {
                console.log(error)
                return
            }
            console.log(data)
            const fieldName = data.user === user ? 'impression_user' : 'impression_partner'
            await supabase
                .from('Pairs')
                .update({ [fieldName]: impression })
                .eq('id', data.id)
                .single()

        } catch(e) {
            console.log(e)
        }
    }

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
        track('start', undefined, {
            user_id: ctx.from.username,
        });
        const username =  ctx.from.username;
        const {user, error} = await getUserFormDB(username);
        if (user){
            saveChatId(ctx);
            ctx.session.user = undefined
        } else {
            await supabase
                .from('Users')
                .insert([{
                    telegram: ctx.from.username,
                    chat_id: ctx.chat.id,
                }])
            const {user, error} = await getUserFormDB(username);
            ctx.session = {user}
        }
        await ctx.reply(messages.welcome(ctx.from.first_name));
        await ctx.replyWithPhoto('https://res.cloudinary.com/dgpgmk0w7/image/upload/v1688229482/static/profileExample_t6woiu.png',  Markup.inlineKeyboard(makeKeyboard(['Поехали 🚀'], 3, 'sync'), {columns: 3}));
    });

    bot.action(/sync(.+)/, async (ctx) => {
        track('sync button pushed',undefined, {
            user_id: ctx.from.username,
        })
        await ctx.answerCbQuery();
        await wait(1000);
        await ctx.scene.enter('profileNormalize');
    })

    bot.action(/isRight_(.+)/, async (ctx) => {
        const optionName = ctx.match[1];
        await ctx.answerCbQuery(); // Required to close the loading state on the button
        if(optionName === 'Да, мой') {
            track('profile recognized',undefined, {
                user_id: ctx.from.username,
            })
            await ctx.reply(`Супер, нужно заполнить недостающие поля`);
            await wait(1000);
            await ctx.scene.enter('profileNormalize');
        } else {
            track('profile not recognized',undefined, {
                user_id: ctx.from.username,
            })
            await ctx.reply(`Написал в поддержку, скоро тебе помогут`);
            const timestamp = new Date().toLocaleString();
            await sendToAdmins(`🚨Пользователь ${ctx.from.username} не признал свой профиль, ${timestamp}`, bot)
        }
    })

    bot.action(/get_review\/([^/]+)/, async (ctx) => {
        const response = ctx.match[1]
        const answer = response.split('_')[1]
        const date = response.split('_')[0]
        const pairDate = dayjs(date).subtract(1, 'day').startOf('week').add(1, 'day')
        await ctx.answerCbQuery();
        if(answer === 'Да, встретились!') {
            ctx.reply('Как прошла встреча?', Markup.inlineKeyboard(makeKeyboard(['Отлично', 'Нормально', 'Ну такое'], 3, `meet_quality/${pairDate.format('YYYY-MM-DD')}`), {columns: 3}))
        }
        if(answer === 'Нет, встретимся позже') {
            await updatePairInSupabase(ctx.from.username, 'later', pairDate)
            await ctx.reply(`Окей, записал`);
        }
        if(answer === 'Не договорились') {

            await updatePairInSupabase(ctx.from.username, 'not_met', pairDate)
            await ctx.reply(`Окей, записал`);
        }
    })

    bot.action(/meet_quality\/([^/]+)/, async (ctx) => {
        const response = ctx.match[1]
        const answer = response.split('_')[1]
        const date = response.split('_')[0]
        const pairDate = dayjs(date)
        if(answer === 'Отлично'){
            await updatePairInSupabase(ctx.from.username, 'great', pairDate)
        }
        if(answer === 'Нормально'){
            await updatePairInSupabase(ctx.from.username, 'ok', pairDate)
        }
        if(answer === 'Ну такое'){
            await updatePairInSupabase(ctx.from.username, 'bad', pairDate)
        }
        await ctx.answerCbQuery();
        await ctx.reply(`Окей, записал`);
    })

    bot.hears('👤 Профиль', async (ctx) => {
        await sendProfile(ctx, true)
        // await ctx.reply('Действия:', Markup.inlineKeyboard(makeKeyboard(['📝 Редактировать'], 2, 'profileActions'), {columns: 2}))

    });
    bot.hears('🤲 Поддержка', async (ctx) => {
        await ctx.reply('Если что-то пошло не так напиши @badavoo или @ivan_tyumenyev в личку. Мы обязательно поможем')
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

    bot.action(/profileActions_(.+)/, async (ctx) => {
        const optionName = ctx.match[1];
        await ctx.answerCbQuery(); // Required to close the loading state on the button
        if(optionName === '📝 Редактировать') {
            await ctx.scene.enter('editScene');
        }
    })

    const multyChoiceFields = ['skills', 'hobbies']
    bot.action(/editProfile_(.+)/, async (ctx) => {
        const optionName = ctx.match[1];
        if(!multyChoiceFields.includes(optionName)) {

        }
        await ctx.answerCbQuery(); // Required to close the loading state on the button
        if(optionName === '📝 Редактировать') {
            await ctx.scene.enter('editScene');
        }
    })

    bot.on('text', async (ctx) => {
        track('text',
            {text: ctx.message.text},
            {user_id: ctx.from.username})
    });

    bot.launch();
    app.listen(process.env.PORT || 3999)
// Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
} catch(e){
    sendToAdmins(`🚨Бот упал, ${e}`)
}

