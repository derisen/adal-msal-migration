var path = require('path');
var express = require("express");
var session = require('express-session');

var adalAuth = require('./auth-adal');
// var msalAuth = require('./auth-msal');

// Initialize express
var app = express();

// setup session middleware
app.use(session({
    secret: "ENTER_SESSION_COOKIE_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // set this to true on production
    }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// setup auth middleware
app.use(adalAuth);
// app.use(msalAuth);

app.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Microsoft identity platform',
        isAuthenticated: req.session.isAuthenticated,
        username: req.session.username,
    });
});

app.listen(4000, () => {
    console.log(`listening on port 4000!`);
});