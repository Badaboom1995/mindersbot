const {getUserFormDB} = require("./getUserFormDB");
const sendToAdmins = async (message, bot) => {
    const admins = ['badavoo']
    admins.forEach( admin => {
        const {user, error} = getUserFormDB(admin);
        if(user.chat_id) {
            bot.telegram.sendMessage(user.chat_id, message);
        }
    })

}

module.exports = {sendToAdmins};