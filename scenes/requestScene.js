const {Markup, Scenes} = require("telegraf");
const {makeKeyboard} = require("../helpers/keyboard");
const { WizardScene } = Scenes;
const {supabase} = require("../supabase");
const {getUserFormDB, sendProfile} = require("../helpers/getUserFormDB");
const dayjs = require('dayjs');
var weekOfYear = require('dayjs/plugin/weekOfYear')
var weekday = require('dayjs/plugin/weekday')


dayjs.extend(weekOfYear)
dayjs.extend(weekday)
const doneMessage = `⭐️ Готово! Твой профиль и запрос опубликованы. Скоро подберем тебе пару.

Если захочешь изменить профиль или запрос - воспользуйся клавиатурой ниже. Там же ты можешь отменить свое участие на следующей неделе, поменять пару и тд.`
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
        .single()

    await supabase
        .from('Users')
        .update({is_ready: true})
        .eq('telegram', ctx.from.username)

    const request = {
        format: ctx.session.format,
        profit_level: ctx.session.funOrProfit,
        location: answer,
    }
    if(!currRequest) {
        request.telegram = ctx.from.username;
        await supabase
            .from('Requests')
            .insert([request])
    } else {
        console.log(dayjs(currRequest.created_at).week())
        console.log(currRequest)
        const { data, error } = await supabase
            .from('Requests')
            .update(request)
            .eq('id', currRequest.id)

        if(error) console.log('error', error)
        console.log('data', data)

    }

}

const requestScene = new WizardScene(
    'requestScene',
    async (ctx) => {
        await ctx.reply(
            `Хочешь встречаться онлайн или офлайн?
            
Если выберешь "офлайн" ботик постарается подобрать собеседника из твоего района, который тоже хочет встретиться оффлайн и пришлет рандомную пару, только если по каким-то причинам (на этой неделе такой формат не выбрал никто из твоего города, например, или выбравших нечетное количество) не получится.`,
            Markup.inlineKeyboard(
                makeKeyboard(
                    ['Офлайн', "Онлайн"],
                    3, 'format'),
                {columns: 3}
            )
        );
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(!checkCorrectAnswer(ctx, 'format')) {
            await ctx.reply('Пожалуйста, выбери один из предложенных вариантов');
            return ctx.scene.enter('requestScene');
        }
        await ctx.answerCbQuery();
        const answer = ctx.callbackQuery?.data.split('_')[1]
        ctx.session.format = answer;
        // send image
        await ctx.replyWithPhoto('https://ibb.co/CwzxZ3F');
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
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(!checkCorrectAnswer(ctx, 'funOrProfit')) {
            await ctx.reply('Пожалуйста, выбери один из предложенных вариантов');
            return ctx.wizard.selectStep(2);
        }
        await ctx.answerCbQuery();
        const answer = ctx.callbackQuery?.data.split('_')[1]
        ctx.session.funOrProfit = answer;
        if(ctx.session.format === 'Онлайн') {
            await ctx.reply(doneMessage);
            await saveRequestToDB(ctx);
            return ctx.scene.leave()
        }
        await ctx.reply(
            'Где ты хочешь встретиться?',
            Markup.inlineKeyboard(
                makeKeyboard(
                    ['Чангу', "Семеньяк", "Букит", "Убуд"],
                    2, 'location'),
                {columns: 3}
            )
        );
        return ctx.wizard.next();
    },
    async (ctx) => {
        // 1 Wait for text answer
        if(!checkCorrectAnswer(ctx, 'location')) {
            await ctx.reply('Пожалуйста, выберите один из предложенных вариантов или нажмите "Отмена"');
            return ctx.wizard.selectStep(3);
        }

        await ctx.answerCbQuery();
        await saveRequestToDB(ctx);
        await ctx.reply(doneMessage);

        return ctx.scene.leave()
    }
);

module.exports = {requestScene};

