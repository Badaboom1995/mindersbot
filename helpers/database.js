const {supabase} = require("../supabase");
const dayjs = require("dayjs");
const database = {
    getUserByTelegram: async function (telegramId) {
        const {data: user, error} = await supabase
            .from('Users')
            .select('*')
            .eq('telegram', telegramId)
            .single()
        return user
    },
    getWeekRequests: async function () {
        const weekStart = dayjs().subtract(1, 'day').subtract(1, 'week').startOf('week').add(1, 'day')
        const weekEnd = dayjs().subtract(1, 'day').subtract(1, 'week').endOf('week').add(1, 'day')
        const { data, error } = await supabase
            .from('Requests')
            .select('*')
            .gt('created_at', weekStart)
            .lt('created_at', weekEnd)
        return data
    },
    getUserRequest: async function (telegramId) {
        const weekStart = dayjs().subtract(1, 'day').subtract(1, 'week').startOf('week').add(1, 'day')
        const weekEnd = dayjs().subtract(1, 'day').subtract(1, 'week').endOf('week').add(1, 'day')
        const {data: request, error} = await supabase
            .from('Requests')
            .select('*')
            .eq('telegram', telegramId)
            .gt('created_at', weekStart)
            .lt('created_at', weekEnd)
            .single()
        return request
    }

}

module.exports = {database}