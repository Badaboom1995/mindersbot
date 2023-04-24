const {supabase} = require("../supabase");

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

const checkGroupMatch = (user, profile) => {
    const mainGroup = getMainGroup(user)
    const profileMainGroup = getMainGroup(profile)
    if(mainGroup === profileMainGroup) {
        return true
    } else {
        return false
    }
}
let counter = 0
const findPersonalMatch = (user, clusters, start, pairedUsers) => {
    const currClusters = clusters.slice(start.clusterIndex)
    currClusters[0] = currClusters[0].slice(start.index + 1)
    let bestMatch = { profile: null, score: 0 }
    currClusters.some((cluster, i) => {
        cluster.forEach((profile, j) => {
            if(profile.id === user.id || pairedUsers.has(profile)) return
            let score = Math.floor(Math.random() * 300)
            // filter offline-online ------
            // if offline filter by location -----

            // if(getMainGroup(user) === getMainGroup(profile)) {
            //     score -= 200
            // }
            // profile.skills?.forEach(skill => {
            //     if(user.skills.includes(skill)) {
            //         score += 10 * funProfit
            //     }
            // });
            // profile.hobbies?.forEach(hobby => {
            //     if(user.hobbies.includes(hobby)) {
            //         score += 10 * (10 - funProfit)
            //     }
            // });
            // if(profile.age > user.age - 5 && profile.age < user.age + 5) {
            //     score += 50
            // }
            if(bestMatch.score < score) {
                bestMatch = {profile, score}
            }
            // if(!bestMatch.profile){
            //     console.log(profile, user)
            // }
        })
        if(bestMatch.score > 200) {
            return true
        }
    })
    if(bestMatch.profile === null) {
        return findPersonalMatch(user, clusters, {clusterIndex: 0, index: 0}, new Set())
    }
    return {...bestMatch, user}
}

const runMatching = (clusters) => {
    const pairs = []
    const pairedUsers = new Set();
    clusters.forEach((cluster, clusterIndex) => {
        cluster.forEach((user, index) => {
            if (pairedUsers.has(user)) return;
            const pair = findPersonalMatch(user, clusters, {clusterIndex, index}, pairedUsers)
            pairs.push(pair);
            pairedUsers.add(user);
            pairedUsers.add(pair.profile);
        })
    })
}

const weeklyMatching = async () => {
   // get all users from supabase
    let { data: Users, error } = await supabase
        .from('Users')
        .select('*')
        .eq('is_ready', true)
console.log(Users.length)
    const clasters = Users.reduce( (acc, user) => {
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
    runMatching(sortedClusters)
    return
}

weeklyMatching()
