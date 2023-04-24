const {Markup, Scenes} = require("telegraf");
const {makeKeyboard} = require("../helpers/keyboard");
const { WizardScene } = Scenes;
const {supabase} = require("../supabase");
const {getUserFormDB, sendProfile} = require("../helpers/getUserFormDB");

const fieldsDict = {
    "Имя": "name",
    "Фото": "profile_photo_url",
    "Описание": "description",
    "Запросы": "requests",
    "Суперсила": "superpower",
    "Навыки": "skills",
    "Увлечения": "hobbies",

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

const editScene = new WizardScene(
    'editProfile',
    async (ctx) => {
        await ctx.reply(
            'Что хотите поменять?',
            Markup.inlineKeyboard(
                makeKeyboard(
                    ['Имя', "Фото", "Описание", "Запросы", "Суперсила", "Навыки", "Увлечения", "Отмена"],
                    3, 'edit'),
                {columns: 3}
            )
        );
        return ctx.wizard.next();
    },
    async (ctx) => {
        // 1 Wait for text answer
        if(!checkCorrectAnswer(ctx, 'edit')) {
            await ctx.reply('Пожалуйста, выберите один из предложенных вариантов или нажмите "Отмена"');
            return ctx.scene.enter('editProfile');
        }
        await ctx.answerCbQuery();
        const answer = ctx.callbackQuery?.data.split('_')[1]
        ctx.session.editField = answer;
        if(answer === 'Имя') {
            await ctx.reply('Введите новое имя')
        }
        if(answer === 'Фото') {
            await ctx.reply('Отправьте новое фото')
        }
        if(answer === 'Описание') {
            await ctx.reply('Введите новое описание')
        }
        if(answer === 'Суперсила') {
            await ctx.reply('Введите новое значение')
        }
        if(answer === 'Навыки') {
            await ctx.reply('Выберите из списка')
        }
        if(answer === 'Увлечения') {
            await ctx.reply('Выберите из списка')
        }
        if(answer === 'Запросы') {
            await ctx.reply('Введите новое значение')
        }
        return ctx.wizard.next();
    },
    async (ctx) => {
        if(!ctx.message) {
            await ctx.reply('Пожалуйста, отправьте текстовое сообщение');
            return ctx.wizard.selectStep(2);
        }
        // 2 Collect text answer
        // return ctx.wizard.selectStep()
        const {editField} = ctx.session;
        const value = ctx.message.text;
        const fieldName = fieldsDict[editField];
        const userNickname = ctx.message.from.username;
            ctx.session.tgNick = userNickname;

        const { error } = await supabase
            .from('Users')
            .update({ [fieldName]: value })
            .eq('telegram', userNickname)
        if(error) {
            console.log(fieldName,value)
            console.log(error)
        } else {
            await ctx.reply('✅ Готово. Что то еще?',Markup.inlineKeyboard(makeKeyboard(['Да','Нет'], 3, 'isMore'), {columns: 3}));
            return ctx.wizard.next();
        }
        ctx.session.tgNick = null;
    },
    async (ctx) => {
        // 3 Manage answer and go to next step
        if(!checkCorrectAnswer(ctx, 'isMore')) {
            // ctx.reply(ctx.callbackQuery?.data || ctx.message.text)
            await ctx.reply('Не понял вас, выберите вариант на клавиатуре',Markup.inlineKeyboard(makeKeyboard(['Да','Нет'], 3, 'isMore'), {columns: 3}));
            return ctx.wizard.selectStep(3);
        }
        const answer = ctx.callbackQuery?.data.split('_')[1]
        if (answer === 'Да') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('editProfile');

        } else {
            await ctx.reply('Отлично, теперь ваш профиль выглядит так:');
            const {user, error} = await getUserFormDB(ctx.session.tgNick);
            await sendProfile(ctx, user);
            await ctx.scene.leave();
        }
    },
);

module.exports = {editScene};