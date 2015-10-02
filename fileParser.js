var AlertHandler = require('./AlertHandler');
var MongoClient = require('mongodb').MongoClient;
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var assert = require('assert');
var fs = require('fs');
var ObjectId = require('mongodb').ObjectID;
//var url = 'mongodb://localhost:27017/test';
//var url = 'mongodb://map-handler:MapsAndM0ngoose@dsi-tools.stanford.edu:27017/test?ssl=true';
var url = 'mongodb://map-handler:MapsAndM0ngoose@dsi-tools.stanford.edu:27017/test';


//Tail the alerts-json file and create the new alerts
var Tail = require('node.tail');
var fs = require('fs');

var fileToTail = "alerts.json";
var lineSeparator= "\n";
var sleepDuration = 1000;

var tail = new Tail(fileToTail,{sep: lineSeparator, follow: true, sleep: sleepDuration })

tail.on('line', function(data) {
//  console.log("got new JSON:", data );
    console.log("got new JSON.");

  //Save the Data as an Alert if file is not truncated

  if (data.indexOf('was cut') > -1 ){
      console.log("Data was cut from the file:", data );
  }
  else
  {
//    console.log("trying to save JSON:", data );
      console.log("=========BEGIN DATA=============");
      console.log(data);
      console.log("=========END DATA=============");

      console.log("trying to save JSON.");

    var alertHandler;

// Read the certificate authority
//      var ca = [fs.readFileSync(__dirname + "/ssl/ca.pem")];

// Connect validating the returned certificates from the server
//      MongoClient.connect(url, {
//	  server: {
//	      sslValidate:true
//	      , sslCA:ca
//	  }
//      }, function(err, db) {
//	  db.close();
//      });


      MongoClient.connect(url, function(err, db) {
//      MongoClient.connect(url, {
//          server: {
//              sslValidate:true
//              , sslCA:ca
//          }
//      }, 

//      assert.equal(null, err);
      alertHandler = new AlertHandler(db);
      
      var alert = JSON.parse(data);


      alertHandler.save('alerts', alert, function(err,docs) {
        if (err) { console.log('error:' + err); }
        else { console.log('Alert created!' ); }
      });
    });
  }

});

tail.on('error', function(data) {
  console.log("error:", data);
});
