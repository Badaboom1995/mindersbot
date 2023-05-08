function removePatternFromString(str, pattern) {
    return str.replace(new RegExp(pattern, 'g'), '');
}

module.exports = {removePatternFromString}