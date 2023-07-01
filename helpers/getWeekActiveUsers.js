const dayjs = require("dayjs");
const {supabase} = require("../supabase");

const getWeekActiveUsers = async () => {
    const weekStart = dayjs().subtract(1, 'day').subtract(1, 'week').startOf('week').add(1, 'day')
    const weekEnd = dayjs().subtract(1, 'day').subtract(1, 'week').endOf('week').add(1, 'day')
    const { data: requests, error } = await supabase
        .from('Requests')
        .select('*')
        .gt('created_at', weekStart)
        .lt('created_at', weekEnd)
    const telegrams = requests.map(request => request.telegram)
    const { data: users, error: usersError } = await supabase
        .from('Users')
        .select('*')
        .in('telegram', telegrams)
        .eq('is_ready', true)

    return users
}

module.exports = {getWeekActiveUsers}
