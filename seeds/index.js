const mongoose = require('mongoose')
const Report = require('../models/report')
const cities = require('./cities')
const names = require('./seedHelpers')

mongoose.set("strictQuery", true);
mongoose.connect('mongodb://localhost:27017/pothole-tracking', { useNewUrlParser: true });


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database Connected")
})


const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Report.deleteMany({});
    for (let i = 0; i < 20; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const rep = new Report({
            author: '63faed13091877860773da72',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            name: `${sample(names.descriptors)}`,
            description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industrys standard dummy',
            soverity: 'LOW',
            date: '3-03-2023',
            time: '15:50:40',
            longitude: 85.6666,
            latitude: 25.8499,
            state: `${cities[random1000].city}`,
            images: [
                {
                    url: 'https://res.cloudinary.com/dcvo0dqyt/image/upload/v1677673091/PotAlert/scwtcmo1kurthji2atyu.jpg',
                    filename: 'PotAlert/scwtcmo1kurthji2atyu'
                }
            ]
        })
        await rep.save()

    }
}
seedDB().then(() => {
    mongoose.connection.close();
})