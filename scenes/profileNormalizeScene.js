const {Markup, Scenes, session} = require("telegraf");
const {makeKeyboard} = require("../helpers/keyboard");
const { WizardScene } = Scenes;
const {supabase} = require("../supabase");
const {getUserFormDB, sendProfile} = require("../helpers/getUserFormDB");
const {getMissingData} = require("../helpers/getMissingData");
const {skillsDict, hobbiesDict} = require("../config");
const {reverseDict} = require("../helpers/reverseDict");
const {uploadImage} = require("../helpers/uploadImage");

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
            const { error } = await supabase
                .from('Users')
                .update({ [ctx.session.currentField]: data })
                .eq('telegram', ctx.session.user?.telegram);
            await ctx.answerCbQuery();

            ctx.session.missingData.shift();
            if(ctx.session.missingData[0]){
                await ctx.reply(`Следующее поле ${ctx.session.missingData[0]}`);
            }
        }
        if(!ctx.session.missingData) {
            ctx.session.missingData = getMissingData(ctx.session.user).filter(field => dataDict.hasOwnProperty(field));
            if(!ctx.session.missingData.includes('hobbies')){ctx.session.missingData.push('hobbies')}
            if(!ctx.session.missingData.includes('skills')){ctx.session.missingData.push('skills')}
            ctx.session.skills = [];
            ctx.session.hobbies = [];
        }

        ctx.session.currentField = ctx.session.missingData[0];
        if(ctx.session.missingData.length && !ctx.callbackQuery) {
            await ctx.reply(`Оставшиеся поля:
- ${ctx.session.missingData.map(item => dataDict[item]).join("\n- ")}`);
        }
        switch (ctx.session.currentField) {
            case 'name':
                 await ctx.reply('Введите новое имя');
                break;
            case 'profile_photo_url':
                 await ctx.reply('Отправьте новое фото');
                break;
            case 'description':
                 await ctx.reply('Введите новое описание');
                break;
            case 'requests':
                 await ctx.reply('Введите новые запросы');
                break;
            case 'superpower':
                 await ctx.reply('Введите новую суперспособность');
                break;
            case 'skills':
                 const skillsAnswer = ctx.callbackQuery?.data.split('_')[1]
                 const skillsPrefix = ctx.callbackQuery?.data.split('_')[0]
                 if(skillsAnswer && skillsPrefix === 'skills'){
                    await ctx.answerCbQuery();
                    ctx.session.skills.push(skillsAnswer);
                    await ctx.reply(`✅ Добавлено ${skillsAnswer}`);
                 }
                 else {
                     const skills = skillsDict.map(item => item.name)
                     await ctx.reply('Можно выбрать до 5 навыков', Markup.inlineKeyboard(makeKeyboard(skills, 2, 'skills'), {columns: 3}));
                     await ctx.reply('Нажмите "Готово" когда закончите', Markup.inlineKeyboard(makeKeyboard(['💾 Готово'], 3, 'done'), {columns: 3}));
                 }
                 if(ctx.session.skills.length >= 5) {
                     return ctx.wizard.next();
                 }
                 return ctx.wizard.selectStep(0)
                break;
            case 'hobbies':
                const hobbiesAnswer = ctx.callbackQuery?.data.split('_')[1]
                const hobbiesPrefix = ctx.callbackQuery?.data.split('_')[0]

                if(hobbiesAnswer && hobbiesPrefix === 'hobbies'){
                    await ctx.answerCbQuery();
                    ctx.session.hobbies.push(hobbiesAnswer);
                    await ctx.reply(`✅ Добавлено ${hobbiesAnswer}`);
                }
                else {
                    const hobbies = hobbiesDict.map(item => item.name)
                    await ctx.reply('Можно выбрать до 7 интересов', Markup.inlineKeyboard(makeKeyboard(hobbies, 2, 'hobbies'), {columns: 3}));
                    await ctx.reply('Нажмите "Готово" когда закончите', Markup.inlineKeyboard(makeKeyboard(['💾 Готово'], 3, 'done'), {columns: 3}));
                }
                if(ctx.session.hobbies.length >= 7) {
                    return ctx.wizard.next();
                }
                return ctx.wizard.selectStep(0)
                break;
            case 'groups':
                 await ctx.reply('Введите новую группу');
                break;
            default:

                // const { error } = await supabase
                //     .from('Users')
                //     .update({ is_updated: true })
                //     .eq('telegram', ctx.session.user.telegram);
                await ctx.reply('Теперь заполним запрос на эту неделю');
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
            const photoUrl = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length-1].file_id);
            const cdnURL = await uploadImage(photoUrl, ctx);
            data = cdnURL
        }
        // console.log(photoUrl)
        // 2 save to db
        const { error } = await supabase
            .from('Users')
            .update({ [ctx.session.currentField]: data })
            .eq('telegram', ctx.session.user.telegram);

        if(error) {
            await ctx.reply('❌ Ошибка');
            return ctx.scene.enter('profileNormalize');
        } else {
            await ctx.reply('✅ Сохранил');
            ctx.session.missingData.shift();
            return ctx.scene.enter('profileNormalize');
        }
    },
);

module.exports = {profileNormalizeScene};