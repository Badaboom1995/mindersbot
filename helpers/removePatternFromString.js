function removePatternFromString(str, pattern) {
    return str.trim().replace(new RegExp(pattern, 'g'), '');
}

module.exports = {removePatternFromString}