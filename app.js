var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql')

var indexRouter = require('./routes/index');
var quotesRouter = require('./routes/quotes');

var app = express();

var con = mysql.createConnection({
	host     : 'remotemysql.com',
	user     : '6OcHtB5ESO',
	password : process.env["SQLPASSWORD"],
	database : '6OcHtB5ESO'
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/quotes', quotesRouter);

app.post('/api/createaccount', function (req, res) {
    let result = null;
    con.connect(function(err) {
      if (err) throw err;
      let sql = `SELECT * FROM users WHERE username = ${req.body.username}`
      con.query(sql, function (err, result) {
        if (req.body.username == result) {
          res.send('this username already exists. choose a new one!')
        } else {
          let sql2 = `INSERT INTO users (username, password) VALUES ('${req.body.username}, '${req.body.password}')`
          con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
            res.send(`account created with username ${req.body.username}!`)
          });
        }
        if (err) throw err;
      });
    });
})

module.exports = app;
