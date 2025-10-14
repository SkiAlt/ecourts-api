// utils/helpers.js

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function genRanHex(size) {
    return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

module.exports = {
    shuffle,
    genRanHex
};