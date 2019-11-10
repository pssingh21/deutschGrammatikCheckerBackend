var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var cors = require('cors')
app.use(cors());

var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:admin@cluster0-sqenn.gcp.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

var WEBSPELLCHECKER = require('webspellchecker-api');

var proofreadApi = WEBSPELLCHECKER.initWebApi({
  lang: 'de_DE', // You can get a list of supported languages with their shortcodes here: http://dev.webspellchecker.net/api/webapi/WEBSPELLCHECKER.html
  serviceId: '1:HB3jD2-r2MG54-sah8o1-AhS643-VdYvv3-e4jFI-VbytT1-RlS9d3-vepBb4-rBfqG-ZU68e2-YJ' //The serviceId is a required parameter. In order to start using WebSpellChecker API, you have to obtain a service key.
});

io.sockets.on('connect', (socket) => {
  console.log('A user is connected');

  socket.emit('check', 'hello');

  socket.on('new-message', (message) => {
    client.connect(err => {
      const collection = client.db("hackathon").collection("hackathon");
      collection.insertOne({"val": message});
    });

    proofreadApi.spellCheck({
      text: message,
      success: function(data) {
        console.log(data);
        socket.emit('wrong-word', data);
      },
      error: function() {}
  });

    proofreadApi.grammarCheck({
      text: message,
      success: function(data) {
          console.log(data); //[ { sentence: 'mispeled text', matches: [ [Object] ] } ]
          console.log(data[0].matches);
          socket.emit('new-message', data[0]);
      },
      error: function() {}
    });

        

  
  });

  socket.on('disconnect', function(){
    console.log("User disconnected");
    client.close();
  });
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(process.env.PORT || 3030, function(){
  console.log('listening on *:3030');
});

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
