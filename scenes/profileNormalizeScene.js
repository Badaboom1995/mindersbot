const {Markup, Scenes} = require("telegraf");
const {makeKeyboard} = require("../helpers/keyboard");
const { WizardScene} = Scenes;
const {supabase} = require("../supabase");
const {getMissingData} = require("../helpers/getMissingData");
const {skillsDict, hobbiesDict} = require("../config");
const {uploadImage} = require("../helpers/uploadImage");
const {track} = require("@amplitude/analytics-node");

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

const dataDict = {
    name: 'Имя',
    profile_photo_url: 'Фото',
    description: 'Описание',
    requests: 'Запросы',
    superpower: 'Суперсила',
    skills: 'Навыки',
    hobbies: 'Увлечения',
    groups: 'К какой группе относитесь',
}

const profileNormalizeScene = new WizardScene(
    'profileNormalize',
    async (ctx) => {
        const answer = ctx.callbackQuery?.data.split('_')[1]
        const prefix = ctx.callbackQuery?.data.split('_')[0]
        if(prefix === 'done'){
            let data
            if(answer){
                if(ctx.session.currentField === 'skills') {
                    data = ctx.session.skills.map(skill => skillsDict.find(item => item.name === skill).id).join(',')
                }
                if(ctx.session.currentField === 'hobbies') {
                    data = ctx.session.hobbies.map(hobby => hobbiesDict.find(item => item.name === hobby).id).join(',')
                }
            }

            await supabase
                .from('Users')
                .update({ [ctx.session.currentField]: data })
                .eq('telegram', ctx.session.user?.telegram);

            await ctx.answerCbQuery();

            ctx.session.missingData.shift();
        }
        if(!ctx.session.missingData) {
            track('normalize scene entered', {
                username: ctx.from.username,
            })
            ctx.session.missingData = getMissingData(ctx.session.user).filter(field => dataDict.hasOwnProperty(field));
            if(!ctx.session.missingData.includes('hobbies')){ctx.session.missingData.push('hobbies')}
            if(!ctx.session.missingData.includes('skills')){ctx.session.missingData.push('skills')}
            ctx.session.skills = [];
            ctx.session.hobbies = [];
        }

        ctx.session.currentField = ctx.session.missingData[0];
        if(!ctx.callbackQuery) {
            await ctx.reply(`Оставшиеся поля:
- ${ctx.session.missingData.map(item => dataDict[item]).join("\n- ")}`);
        }
        switch (ctx.session.currentField) {
            case 'name':
                 await ctx.reply('Как тебя зовут? Укажи имя и фамилию');
                break;
            case 'profile_photo_url':
                 await ctx.reply('Пришли новое фото для профиля. Нужно отправить через вложение');
                break;
            case 'description':
                 await ctx.reply('Расскажи немного о своем профессиональном опыте. Нескольких предложений будет достаточно.');
                break;
            case 'requests':
                 await ctx.reply('Какие у тебя запросы к сообществу? Что ожидаешь от него получить?');
                break;
            case 'superpower':
                 await ctx.reply('Какая у тебя супер сила? Как ты считаешь, в чем тебе нет равных?');
                break;
            case 'skills':
                 if(answer && prefix === 'skills'){
                     track('skill added', {
                         username: ctx.from.username,
                         skill: answer,
                     })
                    await ctx.answerCbQuery();
                    ctx.session.skills.push(answer);
                    await ctx.reply(`✅ Добавил ${answer}`);
                 }
                 else {
                     const skills = skillsDict.map(item => item.name)
                     await ctx.reply('Выбери свои основные профессиональные навыки. Не более 5 вариантов.', Markup.inlineKeyboard(makeKeyboard(skills, 2, 'skills'), {columns: 3}));
                     await ctx.reply('Нажми "Готово" когда закончишь', Markup.inlineKeyboard(makeKeyboard(['💾 Готово'], 3, 'done'), {columns: 3}));
                 }
                 if(ctx.session.skills.length >= 5) {
                     return ctx.wizard.next();
                 }
                 return ctx.wizard.selectStep(0)
                break;
            case 'hobbies':
                if(answer && prefix === 'hobbies'){
                    await ctx.answerCbQuery();
                    track('hobby added', {
                        username: ctx.from.username,
                        skill: answer,
                    })
                    ctx.session.hobbies.push(answer);
                    await ctx.reply(`✅ Добавлено ${answer}`);
                }
                else {
                    const hobbies = hobbiesDict.map(item => item.name)
                    await ctx.reply('Выбери свои увлечения и хобби. Не более 5 вариантов.', Markup.inlineKeyboard(makeKeyboard(hobbies, 2, 'hobbies'), {columns: 3}));
                    await ctx.reply('Нажми "Готово" когда закончишь', Markup.inlineKeyboard(makeKeyboard(['💾 Готово'], 3, 'done'), {columns: 3}));
                }
                if(ctx.session.hobbies.length >= 5) {
                    return ctx.wizard.next();
                }
                return ctx.wizard.selectStep(0)
                break;
            case 'groups':
                 await ctx.reply('К каким группам себя относишь?');
                break;
            default:
                await supabase
                    .from('Users')
                    .update({ is_updated: true })
                    .eq('telegram', ctx.session.user.telegram);

                track('profile is ready', {
                    username: ctx.from.username,
                })
                return ctx.scene.enter('requestScene');
        }
        return ctx.wizard.next();
    },

    async (ctx) => {
        const answer = ctx.callbackQuery?.data.split('_')[1]
        let data = ctx.message?.text
        if(answer){
            if(ctx.session.currentField === 'skills') {
                data = ctx.session.skills.map(skill => skillsDict.find(item => item.name === skill).id).join(',')
            }
            if(ctx.session.currentField === 'hobbies') {
                data = ctx.session.hobbies.map(hobby => hobbiesDict.find(item => item.name === hobby).id).join(',')
            }
        }
        if(ctx.session.currentField === 'profile_photo_url') {
            if(ctx.message.photo){
                const photoUrl = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id);
                const cdnURL = await uploadImage(photoUrl, ctx);
                data = cdnURL
            } else {
                await ctx.reply('Пришли фото через вложение, пожалуйста');
                track('sent photo as text', {
                    username: ctx.from.username,
                })
                return ctx.scene.enter('profileNormalize');
            }
        }
        // console.log(photoUrl)
        // 2 save to db
        const { error } = await supabase
            .from('Users')
            .update({ [ctx.session.currentField]: data })
            .eq('telegram', ctx.session.user.telegram);

        if(error) {
            await ctx.reply('❌ Ошибка');
            track('profile normalize save error', {
                username: ctx.from.username,
            })
            return ctx.scene.enter('profileNormalize');

        } else {

            await ctx.reply('✅ Сохранил');
            track('profile normalize saved prop', {
                username: ctx.from.username,
            })
            ctx.session.missingData.shift();
            return ctx.scene.enter('profileNormalize');
        }
    },
);

module.exports = {profileNormalizeScene};