if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
// Mapbox Code
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;




const express = require('express');
const path = require('path');
const mongoose = require('mongoose')
const session = require('express-session')
const Report = require('./models/report')
const ejsMate = require('ejs-mate')
const flash = require('connect-flash')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./models/user')
const { isLoggedIn } = require('./middleware')
const multer = require('multer')
const methodOverride = require('method-override')
const { storage } = require('./cloudinary')
const upload = multer({ storage })
const Work = require('./models/work')

mongoose.set("strictQuery", true);
mongoose.connect('mongodb://localhost:27017/pothole-tracking', { useNewUrlParser: true });


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("Database Connected")
})

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use(methodOverride('_method'))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})


app.get("/register", (req, res) => {
    res.render('users/register');
})
app.post("/register", async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username })
        const registeredUser = await User.register(user, password)
        // console.log(registeredUser)
        req.flash('success', 'Successfully Created Account Please Login')
        res.redirect('/login')
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('register')
    }
})

app.get('/login', (req, res) => {
    res.render('users/login');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Login Successfully')
    res.redirect('/usershow')
})

app.get('/adminLogin', (req, res) => {
    res.render('users/adminlogin');
})

app.post('/adminLogin', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Login Successfully')
    res.redirect('/reports')
})


app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash('success', "Logout Successfully")
        res.redirect('/login');
    });
});

app.get("/", (req, res) => {
    res.render("home");
})


app.get("/usershow", isLoggedIn, (req, res) => {
    res.render("reports/userShow");
})

// showing all the reports with current status
app.get("/reports", isLoggedIn, async (req, res) => {
    const reports = await Report.find({})
        .populate("author")
        // Adding Status
        .populate({
            path: "works",
            options: { sort: { _id: -1 }, limit: 1 }, // Sort by _id in descending order and limit the result to 1 item
        });

    res.render("reports/index", { reports });
});




app.get('/reports/newCamera', isLoggedIn, (req, res) => {
    res.render('reports/newCamera')
})
app.get('/reports/newFile', isLoggedIn, (req, res) => {
    res.render('reports/newFile')
})

app.post('/reports', upload.array('image'), async (req, res) => {
    const report = new Report(req.body.report)
    report.images = req.files.map(f => ({ url: f.path, filename: f.filename }))
    report.author = req.user._id;
    //Adding date
    const d = new Date();
    report.date = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
    //Adding time
    report.time = `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`

    //
    await report.save();
    console.log(report)
    req.flash('success', 'Successfully Reported A Pothole')
    // res.redirect(`/reports/${report._id}`)  not used
    res.redirect('/userShow')
})
app.post('/reports', upload.array('image'), (req, res) => {
    console.log(req.body, req.files)
    res.send("it worked")
})

// Only Create work
app.post('/reports/:id/works', async (req, res) => {
    const report = await Report.findById(req.params.id)
    const work = new Work(req.body.work)
    report.works.push(work)
    await work.save()
    await report.save()
    res.redirect(`/reports/${report._id}`)
})



app.get('/reports/:id', isLoggedIn, async (req, res) => {
    const report = await Report.findById(req.params.id).populate('author').populate('works')
    res.render('reports/show', { report })
})



app.get('/history', isLoggedIn, (req, res) => {
    const userId = req.user._id;
    Report.find({ author: userId })
        // Adding Status to the History Page
        .populate({
            path: "works",
            options: { sort: { _id: -1 }, limit: 1 }, // Sort by _id in descending order and limit the result to 1 item
        })
        // 
        .populate('author')
        .exec((err, reports) => {
            if (err) {
                console.log(err);
            } else {
                res.render('reports/history', { reports });
            }
        });
});






app.listen(3000, () => {
    console.log("Serving on port 3000");
})