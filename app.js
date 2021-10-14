var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql')

var indexRouter = require('./routes/index');
var quotesRouter = require('./routes/quotes');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/quotes', quotesRouter);

app.get('/api/createaccount', function (req, res) {
  console.log(process.env['APIPASSWORD'])
  if (req.headers.password == process.env['APIPASSWORD']) {
    res.send(`account created with username ${req.headers.username}!`)
  } else {
    res.send(`incorrect api password.`)
  }
})

module.exports = app;
