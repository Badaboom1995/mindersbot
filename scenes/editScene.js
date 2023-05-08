const {Markup, Scenes} = require("telegraf");
const {makeKeyboard} = require("../helpers/keyboard");
const { WizardScene } = Scenes;
const {supabase} = require("../supabase");
const {getUserFormDB, sendProfile} = require("../helpers/getUserFormDB");
const {skillsDict, hobbiesDict} = require("../config");
const {uploadImage} = require("../helpers/uploadImage");
const {track} = require("@amplitude/analytics-node");

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
    'editScene',
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
        ctx.session.skills = []
        ctx.session.hobbies = []
        return ctx.wizard.next();
    },
    async (ctx) => {
        // 1 Wait for text answer
        if(!checkCorrectAnswer(ctx, 'edit')) {
            await ctx.reply('Пожалуйста, выберите один из предложенных вариантов или нажмите "Отмена"');
            return ctx.scene.enter('editScene');
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
            if(ctx.session.skills.length < 5) {
                return ctx.wizard.selectStep(4);
            }
        }
        if(answer === 'Увлечения') {
            await ctx.reply('Выберите из списка')
            if(ctx.session.skills.length < 5) {
                return ctx.wizard.selectStep(4);
            }
        }
        if(answer === 'Запросы') {
            await ctx.reply('Введите новое значение')
        }
        return ctx.wizard.next();
    },
    async (ctx) => {
        const {editField} = ctx.session;
        const answer = ctx.callbackQuery?.data.split('_')[1]
        let data = ctx.message?.text
        const fieldName = fieldsDict[editField];
        // handle checkboxes and radio
        if(answer){
            if(ctx.session.currentField === 'skills') {
                data = ctx.session.skills.map(skill => skillsDict.find(item => item.name === skill).id).join(',')
            }
            if(ctx.session.currentField === 'hobbies') {
                data = ctx.session.hobbies.map(hobby => hobbiesDict.find(item => item.name === hobby).id).join(',')
            }
        }
        // handle photo
        if(fieldName === 'profile_photo_url') {
            if(ctx.message.photo){
                const photoUrl = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id);
                const cdnURL = await uploadImage(photoUrl, ctx);
                data = cdnURL
            } else {
                await ctx.reply('Пришли фото через вложение, пожалуйста');
                track('sent photo as text', {
                    username: ctx.from.username,
                })
                return ctx.scene.enter('editScene');
            }
        }
        // save data to DB
        const userNickname = ctx.message.from.username;
        const { error } = await supabase
            .from('Users')
            .update({ [fieldName]: data })
            .eq('telegram', userNickname)
        // errors?
        if(error) {
            console.log(error)
        } else {
            await ctx.reply('✅ Готово. Что то еще?',Markup.inlineKeyboard(makeKeyboard(['Да','Нет'], 3, 'isMore'), {columns: 3}));
            return ctx.wizard.next();
        }
        ctx.session.tgNick = null;
        // if(!ctx.message) {
        //     await ctx.reply('Пожалуйста, отправьте текстовое сообщение');
        //     return ctx.wizard.selectStep(2);
        // }
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
            await ctx.scene.enter('editScene');

        } else {
            await ctx.reply('Отлично, теперь ваш профиль выглядит так:');
            const {user, error} = await getUserFormDB(ctx.session.tgNick);
            await sendProfile(ctx);
            await ctx.scene.leave();
        }
    },
    // Handle multy select
    async (ctx) => {
        // 3 Manage answer and go to next step
        if(!checkCorrectAnswer(ctx, 'skills') || !checkCorrectAnswer(ctx, 'hobbies')) {
            await ctx.reply('Не понял вас, выберите вариант на клавиатуре',Markup.inlineKeyboard(makeKeyboard(['Да','Нет'], 3, 'isMore'), {columns: 3}));
            return ctx.wizard.selectStep(3);
        }
        const answer = ctx.callbackQuery?.data.split('_')[1]
        if (answer === 'Да') {
            await ctx.answerCbQuery();
            await ctx.scene.enter('editScene');

        } else {
            await ctx.reply('Отлично, теперь ваш профиль выглядит так:');
            const {user, error} = await getUserFormDB(ctx.session.tgNick);
            await sendProfile(ctx);
            await ctx.scene.leave();
        }
    },
);

module.exports = {editScene};