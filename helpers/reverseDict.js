const reverseDict = (dict) => {
    return Object.keys(dict).reduce((acc, key) => {
        acc[dict[key]] = key;
        return acc;
    },{})
}

module.exports = {reverseDict}