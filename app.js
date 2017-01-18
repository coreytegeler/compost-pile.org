var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var session = require('express-session');
var monk = require('monk');
var db = 'localhost:27017/compost';
var db = 'mongodb://heroku_z28551tz:i6b2adudtmtreh9uv2c99faept@ds051913.mlab.com:51913/heroku_z28551tz';
mongoose.connect(db);
require('./config/passport')(passport);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var Location = require('./models/location');
passport.use(Location.createStrategy());
passport.serializeUser(Location.serializeUser());
passport.deserializeUser(Location.deserializeUser());
app.use(session({ secret: 'sssssssshhhhhhhhhhh' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./routes/admin')(app, passport);
require('./routes/index')(app);

app.use(function(req, res, next) {
  req.db = monk(db);
  next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
} else {
  // production error handler
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
}


module.exports = app;
