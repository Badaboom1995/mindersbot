const dayjs = require("dayjs");
const {supabase} = require("../supabase");
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

const findPersonalMatch = async (user, clusters, start, pairedUsers, isLastChance, normalizedPairs) => {
    const requests = await getWeekRequests()
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

            if(profile.id === user.id || pairedUsers.has(profile)) return
            isLastUser = false
            if(!formatMatch && !isLastChance) return
            if(userRequests.format === 'Офлайн' && userRequests.location !== profileRequests.location && !isLastChance) return
            if(isAlreadyPaired && !isLastChance) return

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

module.exports = {findPersonalMatch}