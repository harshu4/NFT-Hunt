const mongoose = require('mongoose');



const studentSchema = new mongoose.Schema({
    address: String,
    gamespart: [String],
    nonce: String,
});


const Student = mongoose.model('Student', studentSchema);
module.exports = Student