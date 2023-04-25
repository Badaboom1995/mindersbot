const {getUserFormDB} = require("./getUserFormDB");
const sendToAdmins = (message, bot) => {
    const admins = ['badavoo', 'ivan_tyumenyev']
    admins.forEach(async (admin) => {
        const {user, error} = await getUserFormDB(admin);
        if(user.chat_id) {
            await bot.telegram.sendMessage(user.chat_id, message);
        }
    });
}

module.exports = {sendToAdmins};