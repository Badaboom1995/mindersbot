const {supabase} = require("../supabase");
const {getWeekActiveUsers} = require("../helpers/getWeekActiveUsers");
const {findPersonalMatch} = require("../helpers/findPersonalMatch");
const {database} = require("../helpers/database");

const getNormalizedPairs = async () => {
    let { data: Pairs, err } = await supabase
        .from('Pairs')
        .select('user, partner' )

    const normalizedPairs = Pairs.map(pair => {
        return [pair.user, pair.partner]
    })
    return normalizedPairs
}

const getInitData = async () => {
    const users = await getWeekActiveUsers()
    const pairs = await getNormalizedPairs()
    const weekRequests = await database.getWeekRequests()
    return {users, pairs, weekRequests}
}

const makePair = async (user) => {
    const {users, pairs, weekRequests} = await getInitData()
    const {skills, hobbies} = user
    const state = {level: 0}

}

const sendPairToUser = async (telegram) => {
    const recepient = await database.getUserByTelegram(telegram)
    // const pair = await findPersonalMatch(recepient, [users], {clusterIndex: 0, index: 0}, new Set(), false, pairs)
    console.log(users, recepient)
}

sendPairToUser('ivan_tyumenyev')

const filters = {
    location: (state, user, partner, ) => {
        // state.
    },
    gender: (state) => {},
    alreadyPaired: (state) => {}
}

const runFilters = (state, filters) => {
    const filtersKeys = Object.keys(filters)
    for(let i; i < Object.keys(filters).length; i++) {
        const filter = filters[filtersKeys[i]]
        filter(state)
    }
}

