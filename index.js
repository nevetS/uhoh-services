//---------------------------//
// Setup variables and libraries
//---------------------------//
var express = require('express');

var methodOverride = require('method-override');
var errorhandler = require('errorhandler');

var AlertHandler = require('./AlertHandler');
//var routes = require('./Routes/alerts');
var http = require('http');
var path = require('path');
var server = require('mongodb').Server;
var bodyParser = require('body-parser');

//var config = require('./Config');
var winston = require('winston');


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

//app.use(errorhandler({ dumpExceptions: true, showStack: true }));

//---------------------------//
//Setup Mongo
//---------------------------//
var MongoClient = require('mongodb').MongoClient;
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

//app.post('/:collection', function(req, res) { 
//    var object = req.body;
//    var collection = req.params.collection;
//    alertHandler.save(collection, object, function(err,docs) {
//          if (err) { res.send(400, err); }
//          else { res.send(201, docs); } 
//     });
//});


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


//Set the REST API calls
//GET AllAlerts
app.get('/AllAlerts', function(req, res) { 
   var params = req.params; 
   alertHandler.handleGetAlerts(req.params.collection, function(error, objs) { 
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


//GET ActiveAlerts
app.get('/ActiveAlerts', function(req, res) {
   var params = req.params;
   alertHandler.handleGetActiveAlerts(req.params.collection, function(error, objs) {
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

//GET MaintenanceAlerts
app.get('/MaintenanceAlerts', function(req, res) {
   var params = req.params;
   alertHandler.handleGetMaintenanceAlerts(req.params.collection, function(error, objs) {
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

//POST CreateAlert
app.post('/Alerts', function(req, res) {
    var object = req.body;
    var collection = req.params.collection;
    alertHandler.handleCreateAlert(collection, object, function(err,docs) {
          if (err) { res.send(400, err); }
          else { res.send(201, docs); }
     });
});

//PUT UpdateAlert
app.put('/Alerts/Alert', function(req, res) {
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

console.log("Logger started.");

app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


console.log("Successfully started web server. Waiting for incoming connections...");


//function start() {
//  console.log("Starting express");

  //routes.setup(app, handlers);
  //var port = process.env.PORT || 3000;
  //app.listen(port);

// http.createServer(app).listen(app.get('port'), function(){
//  console.log('Express server listening on port ' + app.get('port'));
//  });

//}

// *******************************************************
//exports.start = start;
//exports.app = app;

