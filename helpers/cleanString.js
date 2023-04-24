function cleanString(str) {
    const patterns = [
        /@/g,
        /https:\/\/t\.me\//g,
        /https:\/\/web\.telegram\.org\/k\#\//g,
        /http:\/\/t\.me\//g,
        /T\.me/g,
        /t\.me/g,
        /\//g,
    ]
    let cleanStr = str
    patterns.forEach(pattern => {
        cleanStr = cleanStr.replace(pattern, '')
    })
    return cleanStr
}