const getMissingData = (user) => {
    const missingData = [];
    for(key in user) {
        if(!user[key]) missingData.push(key);
    }
    return missingData;
}

module.exports = {getMissingData}