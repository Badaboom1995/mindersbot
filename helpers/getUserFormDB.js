const {supabase} = require("../supabase");
const {messages, skillsDict, hobbiesDict} = require("../config");

const getUserFormDB = async (username) => {
    const { data: user, error } = await supabase
        .from('Users')
        .select('*')
        .eq('telegram', username)
        .single()

    return {user, error};
}

const getNames = (str, dict) => {
    // console.log(str.split(','))
    // console.log(str.split(','))
    return str.split(',').map(item => dict.find(dictItem => dictItem.id === item)?.name).join(', ');
}

const sendProfile = async (ctx, user) => {
    await ctx.replyWithPhoto(user.profile_photo_url || 'https://ibb.co/yS0fKL2');
    await ctx.replyWithHTML(`
<b>${user.telegram}</b>
${user.name ? user.name : 'Имя не указано'} | ${user.description ? user.description : 'Описание не указано'}

<b>💪🏻 Суперсила</b>: ${user.superpower ? user.superpower : messages.noSuperpower()}
<b>⭐️ Группы</b>: ${user.groups ? user.groups : 'Пусто'}
<b>⚽️ Увлечения</b>: ${user.hobbies ? getNames(user.hobbies, hobbiesDict) : messages.noHobbies()}
<b>😎️ Навыки</b>: ${user.skills ? getNames(user.skills, skillsDict) : messages.noSkills()}
<b>🤔 Запросы</b>: ${user.requests ? user.requests : messages.noRequests()}
        `);
}

module.exports = {getUserFormDB, sendProfile}