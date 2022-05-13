const mongoose = require('mongoose');
const gameSchema = new mongoose.Schema({
    gameid: String,
    start: Number,
    encryptsecret:String ,
    winner: String,
    price: Number
});


const Game = mongoose.model('Game', gameSchema);
module.exports = Game;