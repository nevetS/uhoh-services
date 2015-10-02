//---------------------------//
// Setup variables and libraries
//---------------------------//
var express = require('express');

var methodOverride = require('method-override');
var errorhandler = require('errorhandler');

var AlertHandler = require('./AlertHandler');
var http = require('http');
var https = require('https');
var fs = require('fs');
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

app.set('port', process.env.PORT || 8443);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// This line is from the Node.js HTTPS documentation.
var options = {
    key: fs.readFileSync('ssl/keys/dsi-tools.key'),
    cert: fs.readFileSync('ssl/certs/dsi-tools.cert')
};

app.use(errorhandler({ dumpExceptions: true, showStack: true }));

//---------------------------//
//Setup Mongo
//---------------------------//
var MongoClient = require('mongodb').MongoClient;
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var assert = require('assert')
var ObjectId = require('mongodb').ObjectID;
//var url = 'mongodb://localhost:27017/test';
//var url = 'mongodb://map-handler:MapsAndM0ngoose@dsi-tools.stanford.edu:27017/test?ssl=true';
var url = 'mongodb://map-handler:MapsAndM0ngoose@dsi-tools.stanford.edu:27017/test';
var alertHandler;

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  alertHandler = new AlertHandler(db); 
});

//---------------------------//
//Setup Routing for Express
//---------------------------//
//Send an email
app.post('/mail',function(req, res) {
   sendEmail(req.body, function(err)  {
   if (err)
       res.send(err);

   res.json({ message: 'Email Sent' });
   });

});

//Get all the data
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

//Create a new item in the collection
app.post('/:collection', function(req, res) { 
    var object = req.body;
    var collection = req.params.collection;
    alertHandler.save(collection, object, function(err,docs) {
          if (err) { res.send(400, err); }
          else { res.send(201, docs); } 
     });
});


//Change/update the item in the collection
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

//Get a single item in the collection
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
// Start the Server
//---------------------------//

//Start the server
console.log("Logger started.");

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req,res) {
    res.render('404', {url:req.url});
});

https.createServer(options,app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


console.log("Successfully started web server. Waiting for incoming connections...");

