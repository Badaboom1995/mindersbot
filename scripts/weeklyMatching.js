const {supabase} = require("../supabase");
const dayjs = require("dayjs");
const {sendProfileByChatId} = require("../helpers/getUserFormDB");
const {Telegraf} = require("telegraf");
const {getWeekActiveUsers} = require("../helpers/getWeekActiveUsers");
const {request} = require("axios");

const prodToken = '5888882359:AAGcta__XatJMomOeSNIzTvQ9k5y7ejP8jQ'
const bot = new Telegraf(prodToken);


function findMultiplePairings(pairs) {
    const pairings = new Map();

    pairs.forEach(pair => {
        const user1 = pair.user;
        const user2 = pair.profile;

        if(pairings.has(user1)) {
            pairings.set(user1, pairings.get(user1).add(user2));
        } else {
            pairings.set(user1, new Set([user2]));
        }

        if(pairings.has(user2)) {
            pairings.set(user2, pairings.get(user2).add(user1));
        } else {
            pairings.set(user2, new Set([user1]));
        }
    });

    let multiplePairings = [];

    for (let [user, pairSet] of pairings) {
        if(pairSet.size > 1) {
            multiplePairings.push(user);
        }
    }

    return multiplePairings;
}


const getMainGroup = (user) => {
    if(!user) return 'other'
    if(user.groups.includes('Я инвестор')) {
        return 'investor'
    }
    if(user.groups.includes('Я основатель')) {
        return 'founder'
    }
    if(user.groups.includes('Я творческая личность') || user.groups.includes('Я специалист')) {
        return 'professional'
    }
    return 'other'
}

let requests = []
const getWeekRequests = async () => {
    const weekStart = dayjs().subtract(1, 'day').subtract(1, 'week').startOf('week').add(1, 'day')
    const weekEnd = dayjs().subtract(1, 'day').subtract(1, 'week').endOf('week').add(2, 'day')
    const weekRequests = await supabase
        .from('Requests')
        .select('*')
        .gt('created_at', weekStart)
        .lt('created_at', weekEnd)
    return weekRequests.data
}

const findPersonalMatch = (user, clusters, start, pairedUsers, isLastChance, normalizedPairs) => {
    const userRequests = requests?.find(request => {
        return request.telegram === user.telegram
    })
    const currClusters = clusters.slice(start.clusterIndex)
    currClusters[0] = currClusters[0].slice(start.index + 1)
    let bestMatch = { profile: null, score: 0 }
    const funProfit = userRequests.profit_level
    let isLastUser = true

    currClusters.some((cluster, i) => {
        cluster.forEach((profile, j) => {
            const userSkills = user.skills.split(',')
            const userHobbies = user.hobbies.split(',')
            const profileSkills = profile.skills.split(',')
            const profileHobbies = profile.hobbies.split(',')
            const profileRequests = requests?.find(request => request.telegram === profile.telegram)
            const formatMatch = userRequests?.format === profileRequests.format
            const isAlreadyPaired = normalizedPairs.some(pair => pair.includes(user.telegram) && pair.includes(profile.telegram))

            if(profile.id === user.id || pairedUsers.has(profile)) {
                if(user.telegram === 'monkey_hero') {
                    console.log(profile.telegram, 'is already paired')
                }
                return
            }
            isLastUser = false
            if(!formatMatch && !isLastChance) {
                if(user.telegram === 'monkey_hero') {
                    console.log('format mismatch')
                }
                return
            }
            if(userRequests.format === 'Офлайн' && userRequests.location !== profileRequests.location && !isLastChance) {
                if(user.telegram === 'monkey_hero') {
                    console.log('location mismatch')
                }
                return
            }
            if(isAlreadyPaired && !isLastChance) {
                if(user.telegram === 'monkey_hero') {
                    console.log('already paired')
                }
                return
            }

            let score = 1
            if(userRequests.location === profileRequests.location) {
                score += 500
            }
            if(getMainGroup(user) === getMainGroup(profile)) {
                score += 100
            }
            profileSkills?.forEach(skill => {
                if(userSkills.includes(skill)) {
                    score += funProfit
                }
            });
            profileHobbies?.forEach(hobby => {
                if(userHobbies.includes(hobby)) {
                    score += (100 - funProfit)
                }
            });
            if(bestMatch.score < score) {
                bestMatch = {profile, score, isLastChance}
            }
        })
        if(bestMatch.score > 200) {
            return true
        }
    })
    if(bestMatch.profile === null && isLastChance) {
        const flatClusters = clusters.flat()
        const cleanCluster = flatClusters.filter(profile => profile.telegram !== user.telegram)
        const bestMatch = {profile: cleanCluster[Math.floor(Math.random()*cleanCluster.length)], score: 0, user}
        return bestMatch
    }
    if(bestMatch.profile === null) {
        if (!isLastUser){
            const lastPair = currClusters.flat().find(profile => !pairedUsers.has(profile))
            bestMatch = {profile: lastPair, score: 0}
        } else {
            return findPersonalMatch(user, clusters, {clusterIndex: 0, index: 0}, new Set(), true, normalizedPairs)
        }
    }
    return {...bestMatch, user}
}

const runMatching = (clusters, normalizedPairs) => {
    const pairs = []
    const pairedUsers = new Set();
    clusters.forEach((cluster, clusterIndex) => {
        cluster.forEach((user, index) => {
            if (pairedUsers.has(user)) return;
            const pair = findPersonalMatch(user, clusters, {clusterIndex, index}, pairedUsers, false, normalizedPairs)
            pairs.push(pair);
            pairedUsers.add(user);
            pairedUsers.add(pair.profile);
        })
    })

    const multiplePairs = findMultiplePairings(pairs)
    let counter = 0
    const sendPair = async (pair) => {
        try {
            console.log(`send to ${pair.user.telegram}|${pair.user.chat_id}: Привет! Твоя пара на эту неделю -  @${pair.profile.telegram}`)
            console.log(`send to ${pair.profile.telegram}|${pair.profile.chat_id}: Привет! Твоя пара на эту неделю -  @${pair.user.telegram}`)
            console.log(counter++)
            await Promise.all([
                bot.telegram.sendMessage(pair.user.chat_id, `Привет! Твоя пара на эту неделю -  @${pair.profile.telegram}`),
                sendProfileByChatId(pair.user.chat_id, pair.profile),
                bot.telegram.sendMessage(pair.user.chat_id, `Случайным образом мы выбрали тебя в качестве ответственного за встречу. Пожалуйста, свяжись с @${pair.profile.telegram} и договорись о встрече.`),
                bot.telegram.sendMessage(pair.profile.chat_id, `Привет! Твоя пара на эту неделю -  @${pair.user.telegram}`),
                sendProfileByChatId(pair.profile.chat_id, pair.user)
            ])
        } catch(e){
            await bot.telegram.sendMessage('208165379', `ошибка ${e} ${pair.user.telegram}`)
        }
    }
    const promises = pairs.map(pair => sendPair(pair))
    Promise.all(promises).then((res) => {
        Promise.all(multiplePairs.map( user => bot.telegram.sendMessage(user.chat_id, `На этой неделе у нас нечетное количество участников и тебе досталась дополнительная пара :)`)))
        supabase
            .from('Pairs')
            .insert(pairs.map(pair => {
                return {
                    user: pair.user.telegram,
                    partner: pair.profile.telegram,
                    Created: dayjs().format()
                }
            }))
            .then((res) => {
                console.log(res)
        })
        console.log('done')
    })
}

const weeklyMatching = async () => {
    const users = await getWeekActiveUsers()
    let { data: Pairs, err } = await supabase
        .from('Pairs')
        .select('user, partner' )

    const normalizedPairs = Pairs.map(pair => {
        return [pair.user, pair.partner]
    })

    requests = await getWeekRequests()
    const clasters = users.reduce( (acc, user) => {
        if(user.groups.includes('Я инвестор')) {
            acc.investors.push(user)
            return acc
        }
        if(user.groups.includes('Я основатель')) {
            acc.founders.push(user)
            return acc
        }
        if(user.groups.includes('Я творческая личность') || user.groups.includes('Я специалист')) {
            acc.specialists.push(user)
            return acc
        }
        acc.others.push(user)
        return acc
    },{
        investors: [],
        founders: [],
        specialists: [],
        others: []
    })

    const sortedClusters = [clasters.investors, clasters.founders,clasters.specialists]
    runMatching(sortedClusters, normalizedPairs)
    return
}

weeklyMatching()
