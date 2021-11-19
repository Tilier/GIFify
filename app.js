var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql')
var session = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// var indexRouter = require('./routes/index');
// var quotesRouter = require('./routes/quotes');

var app = express();

var db_config = {
	host     : 'remotemysql.com',
	user     : '6OcHtB5ESO',
	password : process.env["SQLPASSWORD"],
	database : '6OcHtB5ESO'
};

var connection;

connection = mysql.createConnection(db_config);

connection.connect(function(err) {
  if(err) {
    console.log('error when connecting to db:', err);
    setTimeout(handleDisconnect, 2000)
  }
});

connection.on('error', function(err) {
  console.log('db error', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect();                         // lost due to either server restart, or a
  } else {                                      // connnection idle timeout (the wait_timeout
    throw err;                                  // server variable configures this)
  }
});

function sendMessage(message, type, req, res, next) {
  req.session.message = message;
  req.session.messagetype = type;
  console.log('set')
  
  res.redirect('/');
  next();
}

/* app.use(session({
	secret: 'g8sdaf9sf0ms',
	resave: true,
	saveUninitialized: true
})); */

app.set('trust proxy', 1) // trust first proxy
 
app.use(session({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/quotes', quotesRouter);

// prevent mysql timeout
setTimeout(function() {
  // random query to database
  connection.query('SELECT username FROM users', function (err, result) {})
}, 600)

app.get('/', function (req, res) {
  if (typeof req.session.message == 'string') {
    console.log(req.session.message)
    let message = req.session.message;
    let messagetype = req.session.messagetype;
    req.session.message = null;
    req.session.messagetype = null;
    console.log(`before: ${message} ~ after: ${req.session.message}`)
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset=utf-8>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>GIFify</title>
        <link rel="stylesheet" href="style.css">
        <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" rel="icon" type="image/x-icon">
      </head>
      <body>
        <h3>${message}</h3>
        <a href="/">continue to GIFify</a>
      <script type="module" src="index.js"></script>
      </body>
    </html>
    `)
  } else {
    if (req.session.loggedin == true) {
      res.sendFile(__dirname + '/public/home.html')
    } else {
      res.sendFile(__dirname + '/public/signup.html')
    }
  }
})

app.post('/api/createaccount', function (req, res, next) {
      let sql = `SELECT username FROM users WHERE username = '${req.body.username}'`
      try {
      connection.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          sendMessage('this username already exists. try a new one!', 'error', req, res, next)
        } else {
          bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
          let sql2 = `INSERT INTO users (username, password) VALUES ('${req.body.username}', '${hash}')`
          connection.query(sql2, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
            // res.send(`account created with username ${req.body.username}!`)
            req.session.accountusername = `${req.body.username}`
            req.session.accountpassword = `${req.body.password}`
            req.session.loggedin = true
            sendMessage(`successfully created an account with the name ${req.body.username}!`, 'success', req, res, next)
          });
          })
        }
      });
      } catch (e) {
        sendMessage('an error occured. please try again.', 'error', req, res, next)
      }
})

app.post('/api/auth', function (req, res, next) {
  let sql = `SELECT password FROM users WHERE username = '${req.body.username}'`
  connection.query(sql, function (err, result) {
    if (err) throw err;
    if (result.length > 0) {
      bcrypt.compare(req.body.password, result[0]["password"], function(err, result2) {
        if (result2 == true) {
          req.session.accountusername = `${req.body.username}`
          req.session.accountpassword = `${req.body.password}`
          req.session.loggedin = true
          // res.send(`result: ${result} ~ result2: ${result2}`)
          sendMessage('logged in!', 'success', req, res, next)
          next();
        } else {
          sendMessage('incorrect password.', 'error', req, res, next)
        }
      })
    } else {
      sendMessage('incorrect username.', 'error', req, res, next)
    }
  })
})

app.post('/api/requestfriend', function (req, res, next) {
      let sql = `SELECT username FROM users WHERE username = '${req.body.receiver}'`
      try {
      connection.query(sql, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
        let sql2 = `SELECT sender FROM friendRequests WHERE sender = '${req.session.accountusername}' and receiver = '${req.body.receiver}'`
          connection.query(sql2, function (err, result) {
            if (err) throw err;
            console.log(`result: ${result}, sender: ${req.session.accountusername}, receiver: ${req.body.receiver}`)
            if (result.length > 0) {
              sendMessage('calm down! you\'ve already sent this friend request.', 'error', req, res, next)
              
              return;
            } else {
              let sql3 = `SELECT friend1 FROM friends WHERE friend1 = '${req.body.receiver}' and friend2 = '${req.session.accountusername}'`
              connection.query(sql3, function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                  sendMessage('you\'ve already sent a friend request to this person!', 'error', req, res, next)
                } else {
                  let sql4 = `SELECT receiver FROM friendRequests WHERE sender = '${req.body.receiver}' and receiver = '${req.session.accountusername}'`
                  connection.query(sql4, function (err, result) {
                    if (err) throw err;
                    if (result.length > 0) {
                      sendMessage('this user has already sent you a friend request. that means that you are now friends!', 'success', req, res, next)
                      let sql4p2 = `DELETE FROM friendRequests WHERE sender = '${req.body.receiver}' and receiver = '${req.session.accountusername}'`
                      connection.query(sql4p2, function (err, result) {
                        if (err) throw err;
                        let sql4p3 = `INSERT INTO friends (friend1, friend2) VALUES ('${req.body.receiver}', '${req.session.accountusername}')`
                        connection.query(sql4p3, function (err, result) {
                          if (err) throw err;
                        })
                      })
                    } else {
                      let sql5 = `INSERT INTO friendRequests (sender, receiver) VALUES ('${req.session.accountusername}', '${req.body.receiver}')`
                      connection.query(sql5, function (err, result) {
                        if (err) throw err;
                        console.log("1 record inserted");
                        sendMessage('friend request sent!', 'success', req, res, next)
                      });
                    }
                  })
                }
              })
            }
          })
        } else {
          sendMessage('invalid username', 'error', req, res, next)
        }
      });
      } catch (e) {
        sendMessage('an error occured. please try again.', 'error', req, res, next)
      }
})

app.get('/api/signout', function (req, res, next) {
  req.session.accountusername = null
  req.session.accountpassword = null
  req.session.loggedin = null
  res.redirect('/')
  
  next();
})

app.post('/api/sendgifmessage', function (req, res, next) {
  let sql = `INSERT INTO messages (sender, receiver, gif, caption) VALUES ('${req.session.accountusername}', '${req.body.receiver}', '${req.body.gif}', '${req.body.caption}')`
  connection.query(sql, function (err, result) {
    if (err) throw err;
    console.log("1 record inserted")
    res.send('message sent.')
  })
})

app.get('/api/messagelist', function (req, res, next) {
  let sql = `SELECT * FROM messages WHERE receiver = '${req.session.accountusername}'`
  connection.query(sql, function (err, result) {
    if (err) throw err;
    res.send(JSON.stringify(result))
  })
})

// custom 500?
/* app.use(function (error, req, res, next) {
    res.send('oops! an internal server error occured. please try again.', 500);
    console.log(error);
}); */

module.exports = app;
