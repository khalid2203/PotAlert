const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    name: String,
    images: [
        {
            url: String,
            filename: String
        }
    ],
    soverity: String,
    state: String,
    description: String,
    location: String,
    date: String,
    // date: { type: Date, default: Date.now },
    time: String,
    longitude: Number,
    latitude: Number,
    works: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Work'
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

module.exports = mongoose.model('Report', ReportSchema)