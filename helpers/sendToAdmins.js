const {getUserFormDB} = require("./getUserFormDB");
const sendToAdmins = async (message, bot) => {
    // const admins = ['badavoo', 'ivan_tyumenyev']
    const {user, error} = await getUserFormDB('badavoo');
    if(user.chat_id) {
        await bot.telegram.sendMessage(user.chat_id, message);
    }
}

module.exports = {sendToAdmins};