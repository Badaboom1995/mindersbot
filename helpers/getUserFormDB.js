const {supabase} = require("../supabase");
const {messages, skillsDict, hobbiesDict} = require("../config");
const {removePatternFromString} = require("./removePatternFromString");

const getUserFormDB = async (username) => {
    const { data: user, error } = await supabase
        .from('Users')
        .select('*')
        .eq('telegram', username)
        .single()
    return {user, error};
}

const getNames = (str, dict) => {
    return str.split(',').map(item => dict.find(dictItem => dictItem.id === item)?.name).join('\n');
}

const sendProfile = async (ctx) => {
    const data = await getUserFormDB(ctx.from.username);
    const user = data.user
    await ctx.replyWithPhoto(user.profile_photo_url || 'https://i.ibb.co/bJ1WYpt/Group-993.jpg',
        {
        caption: `<b>${user.name ? user.name : 'Имя не указано'}</b>  | ${user.groups?.split(',').map(group => `#${group.trim().split(' ').slice(1).join('')}`).join(' ')}

${user.description ? user.description : 'Описание не указано'}

<b>Навыки</b>:
${user.skills ? getNames(user.skills, skillsDict) : messages.noSkills()}

<b>Увлечения</b>:
${user.hobbies ? getNames(user.hobbies, hobbiesDict) : messages.noHobbies()}

<b>Суперсила</b>: ${user.superpower ? user.superpower : messages.noSuperpower()}

<b>Запросы</b>: ${user.requests ? user.requests : messages.noRequests()}
`,
    parse_mode: 'HTML'
    }
    );

//     await ctx.replyWithHTML(`
// <b>${user.name ? user.name : 'Имя не указано'}</b> | ${user.description ? user.description : 'Описание не указано'} | ${user.groups.split(',').map(group => removePatternFromString(group, 'Я ')).join('\n')}
//
// <b>😎️ Навыки</b>: ${user.skills ? getNames(user.skills, skillsDict) : messages.noSkills()}
// <b>⚽️ Увлечения</b>: ${user.hobbies ? getNames(user.hobbies, hobbiesDict) : messages.noHobbies()}
// <b>💪🏻 Суперсила</b>: ${user.superpower ? user.superpower : messages.noSuperpower()}
// <b>🤔 Запросы</b>: ${user.requests ? user.requests : messages.noRequests()}
//
//
//         `);
}

module.exports = {getUserFormDB, sendProfile}