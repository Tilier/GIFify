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

// app.use('/', indexRouter);
app.use('/quotes', quotesRouter);

con.connect((err) => {
    if(err) throw err;
    console.log('Connected to MySQL Server!');
});

app.get('/', function (req, res) {
  console.log(req.session.loggedin)
  if (req.session.loggedin == true) {
    res.sendFile(__dirname + '/public/index.html')
  } else {
    res.sendFile(__dirname + '/public/signup.html')
  }
})

app.post('/api/createaccount', function (req, res) {
      let sql = `SELECT username FROM users WHERE username = '${req.body.username}'`
      try {
      con.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          res.send('this username already exists. choose a new one!')
        } else {
          let sql2 = `INSERT INTO users (username, password) VALUES ('${req.body.username}', '${req.body.password}')`
          con.query(sql2, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
            res.send(`account created with username ${req.body.username}! result: ${result}!`)
          });
        }
      });
      } catch (e) {
        res.send('an error occured.')
      }
})

app.post('/api/auth', function (req, res) {
  let sql = `SELECT username FROM users WHERE username = '${req.body.username}' and password = '${req.body.password}'`
  con.query(sql, function (err, result) {
    if (err) throw err;
    if (result.length > 0) {
      res.send('successfully logged in!')
    } else {
      res.send('incorrect username or password.')
    }
  })
})

// custom 500?
/* app.use(function (error, req, res, next) {
    res.send('oops! an internal server error occured. please try again.', 500);
    console.log(error);
}); */

module.exports = app;
