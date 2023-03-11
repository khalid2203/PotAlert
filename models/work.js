const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const workSchema = new Schema({
    name: String,
    contact: Number,
    status: String
})

module.exports = mongoose.model("Work", workSchema)