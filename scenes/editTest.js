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


// Step 0
// if no current field show main menu
// if current field is not empty show field menu
// Step 1
// check answer type and save it to session
// if done -> save to db and leave scene
const multyChoice = ['skills', 'hobbies']
const profileNormalizeScene = new WizardScene(
    'editTest',
    async (ctx) => {
        const answer = ctx.callbackQuery?.data.split('_')[1]
        const prefix = ctx.callbackQuery?.data.split('_')[0]
        await ctx.answerCbQuery();

        if(multyChoice.includes(prefix) && !ctx.session.multyChoice) {
            ctx.session.multyChoice = true;
        }

        if(ctx.session.multyChoice) {
            if(ctx.session[prefix].length > 4) {

            }
            // check for maximum
            // save to session
        } else {
            await ctx.reply(
                'Что хотите поменять?',
                Markup.inlineKeyboard(
                    makeKeyboard(
                        ['Имя', "Фото", "Описание", "Запросы", "Суперсила", "Навыки", "Увлечения", "Отмена"],
                        3, 'edit'),
                    {columns: 3}
                )
            );
            // save to DB

        }


        if(prefix === 'done'){}
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