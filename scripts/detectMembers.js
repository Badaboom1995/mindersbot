const {supabase} = require("../supabase");

const isMember = async (member) => {
    const {error} = await supabase
        .from('Users')
        .update({ chat_id: ctx.chat.id })
        .eq('telegram', ctx.from.username);
}
const detectMembers = async () => {
    const {data:users, error} = await supabase
        .from('Users')
        .select('*');

    const {data:members} = await supabase
        .from('IsMember')
        .select('*');

    users.forEach(async (user) => {
        const match = members.find(member => member.telegram.toLowerCase() === user.telegram.toLowerCase());
        if(match?.isMember.trim() !== 'нет') {
            console.log(match)
            await supabase
                .from('Users')
                .update({ is_member: true })
                .eq('telegram', user?.telegram)
        }
    });
}

detectMembers()