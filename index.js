//---------------------------//
// Setup variables and libraries
//---------------------------//
var express = require('express');

var methodOverride = require('method-override');
var errorhandler = require('errorhandler');

var AlertHandler = require('./AlertHandler');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var router = express.Router();
//var config = require('./Config');
var winston = require('winston');

var nodemailer = require("nodemailer");

//---------------------------//
//Setup Logging
//---------------------------//

// We will log normal api operations into api.log
console.log("starting logger...");
winston.add(winston.transports.File, {
  //filename: config.logger.api
  filename: 'map.log',
});

// We will log all uncaught exceptions into exceptions.log
winston.handleExceptions(new winston.transports.File({
        //filename: config.logger.exception
        filename: 'exceptions.log',
}));

//---------------------------//
//Setup Express
//---------------------------//
var app = express();
app.use(bodyParser.json()); 
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'));

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(errorhandler({ dumpExceptions: true, showStack: true }));

//---------------------------//
//Setup Mongo
//---------------------------//
var MongoClient = require('mongodb').MongoClient;
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var assert = require('assert')
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/test';
var alertHandler;

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  alertHandler = new AlertHandler(db); 
});

//---------------------------//
//Setup Routing for Express
//---------------------------//
app.get('/:collection', function(req, res) { 
   var params = req.params; 
   alertHandler.findAll(req.params.collection, function(error, objs) { 
          if (error) { res.send(400, error); } 
              else {
                  if (req.accepts('html')) { 
                  res.render('data',{objects: objs, collection: req.params.collection}); 
              } else {
                  res.set('Content-Type','application/json'); 
                  res.send(200, objs); 
              }
         }
        });
});

app.post('/:collection', function(req, res) { 
    var object = req.body;
    var collection = req.params.collection;
    alertHandler.save(collection, object, function(err,docs) {
          if (err) { res.send(400, err); }
          else { res.send(201, docs); } 
     });
});


app.put('/:collection/:entity', function(req, res) { 
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       alertHandler.update(collection, req.body, entity, function(error, objs) { 
          if (error) { res.send(400, error); }
          else { res.send(200, objs); } 
       });
   } else {
       var error = { "message" : "Cannot PUT a whole collection" };
       res.send(400, error);
   }
});

app.get('/:collection/:entity', function(req, res) { 
   var params = req.params;
   var entity = params.entity;
   var collection = params.collection;
   if (entity) {
       alertHandler.get(collection, entity, function(error, objs) { 
          if (error) { res.send(400, error); }
          else { res.send(200, objs); } 
       });
   } else {
      res.send(400, {error: 'bad url', url: req.url});
   }
});

//Send an email
app.post('/mail',function(req, res) {
   sendEmail(req.body, function(err)  {
   if (err)
       res.send(err);

   res.json({ message: 'Email Sent' });
   });

});

function sendEmail(mailDetails){
  var nodemailer = require('nodemailer');

  // create reusable transporter object using SMTP transport
  var transporter = nodemailer.createTransport({
     service: 'mail',
     auth: {
        user: '',//put in your credentials
        pass: ''
    }
  });


 // setup e-mail data with unicode symbols
  var mailOptions = {
      from: mailDetails.from,        // sender address
      to: mailDetails.to,            // list of receivers
      subject: mailDetails.subject,  // Subject line
      text: mailDetails.body         // plaintext body
  };

 // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }  else {
          console.log('Message sent: ' + info.response)
      };
 });

}

//---------------------------//
//Tail the alerts.json file
//write the changes to mongo
//---------------------------//
//Tail the alerts-json file and create the new alerts
var Tail = require('node.tail');
var fs = require('fs');

var fileToTail = "alerts.json";
var lineSeparator= "]}},";
var sleepDuration = 1000;

var tail = new Tail(fileToTail,{sep: lineSeparator, follow: true, sleep: sleepDuration })

tail.on('line', function(data) {
  console.log("got new JSON:", data );

  //Save the Data as an Alert if file is not truncated
  if (data.indexOf('was cut') > -1 ){
      console.log("Data was cut from the file:", data );
  }
  else
  {
    console.log("trying to save JSON:", data );
    // TODO - Get the alerts to save
    //alertHandler.save('alerts', alert, function(err,docs) {
    //    if (err) { console.log('error:' + err); }
    //    else { console.log('Alert created!' ); }
    // });
  }

});

tail.on('error', function(data) {
  console.log("error:", data);
});


//---------------------------//
// Start the Server
//---------------------------//

//Start the server
console.log("Logger started.");

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


console.log("Successfully started web server. Waiting for incoming connections...");

