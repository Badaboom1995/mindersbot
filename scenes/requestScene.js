const {Markup, Scenes} = require("telegraf");
const {makeKeyboard} = require("../helpers/keyboard");
const { WizardScene } = Scenes;
const {supabase} = require("../supabase");
const dayjs = require('dayjs');
const {createKeyboard} = require("../helpers/makeRegularKeyboard");
const {track} = require("@amplitude/analytics-node");
const {sendProfile} = require("../helpers/getUserFormDB");
const {wait} = require("../helpers/wait");

const mainKeyboard = createKeyboard({keys: ['👤 Профиль', '🤲 Поддержка'], rows:2})
const sendDoneMessage = async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(`Получилось! 🙌

Теперь ты — участник встреч minders community ☕️

Присоединяйся к нашим соц.сетям:
💙 t.me/minders_channel
📸 instagram.com/minders.community

`, {
        disable_web_page_preview: true,
    }
)
    // await sendProfile(ctx, ctx.from.username)
    ctx.reply(`В понедельник мы пришлем подобранного специально для тебя участника. Хороших встреч! ☕️`, mainKeyboard);
}

const checkCorrectAnswer = (ctx, prefix, isText) => {
    if(!ctx.callbackQuery) return false;
    const {data} = ctx.callbackQuery;
    const [answer_prefix, answer] = data.split('_');
    if (answer_prefix === prefix) {
        ctx.wizard.state.editField = answer;
        return true;
    }
    return false;
}

const saveRequestToDB = async (ctx) => {
    const answer = ctx.callbackQuery?.data.split('_')[1]
    const firstDayOfWeek = dayjs().startOf('week');

    const { data: currRequest, error } = await supabase
        .from('Requests')
        .select('*')
        .gt('created_at', firstDayOfWeek)
        .eq('telegram', ctx.from.username)
        .single()

    await supabase
        .from('Users')
        .update({is_ready: true})
        .eq('telegram', ctx.from.username)

    const request = {
        profit_level: ctx.session.funOrProfit,
        format: ctx.session.format,
    }
    if(ctx.session.location) {
        request.location = ctx.session.location;
    } else {
        request.location = null;
    }

    if(!currRequest) {
        request.telegram = ctx.from.username;
        await supabase
            .from('Requests')
            .insert([request])
    } else {
        const { data, error } = await supabase
            .from('Requests')
            .update(request)
            .eq('id', currRequest.id)

        if(error) console.log('error', error)
    }
}

const requestScene = new WizardScene(
    'requestScene',
    /// STEP 0 --------------------
    async (ctx) => {
        await ctx.replyWithPhoto('https://i.ibb.co/p1xC8Bp/Screen-Shot-2023-04-21-at-10-50-50.png');
        await ctx.reply(
            `Некоторые люди приходят на встречи, чтобы найти партнёров для будущих проектов и завести полезные контакты, условно назовём это "пользой". А кто-то приходит для расширения кругозора, новых эмоций и открытия чего-то нового, назовём это "фан". Какое описание больше подходит тебе?
            
Выбери соотношение фана и пользы. Чем больше цифра тем больше пользы. Картинка поможет с выбором :)`,
            Markup.inlineKeyboard(
                makeKeyboard(
                    ['0%', "25%", "50%", "75%", "100%"],
                    6, 'funOrProfit'),
                {columns: 6}
            )
        );
        track('fun/use', undefined, {user_id: ctx.from.username})
        return ctx.wizard.next();
    },
    /// STEP 1 --------------------
    async (ctx) => {
        if(!checkCorrectAnswer(ctx, 'funOrProfit')) {
            await ctx.reply('Пожалуйста, выбери один из предложенных вариантов');
            return ctx.scene.enter('requestScene');
        }
        await ctx.answerCbQuery();
        const answer = ctx.callbackQuery?.data.split('_')[1]
        ctx.session.funOrProfit = answer.replace("%", "");
        await ctx.reply(
            `Как ты хочешь встречаться с участниками - онлайн или офлайн на Бали?`,
            Markup.inlineKeyboard(
                makeKeyboard(
                    ['Офлайн', "Онлайн"],
                    3, 'format'),
                {columns: 3}
            )
        );
        track('meeting format filled', undefined, {user_id: ctx.from.username})
        return ctx.wizard.next();
    },
    /// STEP 2 --------------------
    async (ctx) => {
        if(!checkCorrectAnswer(ctx, 'format')) {
            await ctx.reply('Пожалуйста, выбери один из предложенных вариантов');
            return ctx.wizard.selectStep(1);
        }
        const answer = ctx.callbackQuery?.data.split('_')[1]
        ctx.session.format = answer
        if(answer === 'Онлайн') {
            await saveRequestToDB(ctx);
            await sendDoneMessage(ctx)
            track('request done', undefined, {user_id: ctx.from.username})
            return ctx.scene.leave()
        }
        await ctx.reply(
            'Выбери подходящие локации для встреч.',
            Markup.inlineKeyboard(
                makeKeyboard(
                    ['Чангу (Семеньяк)', "Букит", "Убуд"],
                    2, 'location'),
                {columns: 3}
            )
        );
        track('location filled', undefined, {user_id: ctx.from.username})
        return ctx.wizard.next();
    },
    /// STEP 3 FINAL --------------------
    async (ctx) => {
        // 1 Wait for text answer
        if(!checkCorrectAnswer(ctx, 'location')) {
            await ctx.reply('Пожалуйста, выберите один из предложенных вариантов или нажмите "Отмена"');
            return ctx.wizard.selectStep(3);
        }
        const answer = ctx.callbackQuery?.data.split('_')[1]
        ctx.session.location = answer
        await saveRequestToDB(ctx);
        await sendDoneMessage(ctx)
        // mainKeyboard
        track('request done', undefined, {user_id: ctx.from.username})
        return ctx.scene.leave()
    }
);

module.exports = {requestScene};

