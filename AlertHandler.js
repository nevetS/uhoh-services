var winston = require('winston');
var ObjectID = require('mongodb').ObjectID;
var util = require('util');
AlertHandler = function(db) {
  this.db = db;
};

AlertHandler.prototype.findAll = function(collectionName, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
      if( error ) callback(error);
      else {
        the_collection.find().toArray(function(error, results) { 
          if( error ) callback(error);
          else callback(null, results);
        });
      }
    });
};

AlertHandler.prototype.getCollection = function(collectionName, callback) {
//    console.log("Collection target is: " + collectionName);
  this.db.collection(collectionName, function(error, the_collection) {
    if( error ) callback(error);
    else callback(null, the_collection);
  });
};


AlertHandler.prototype.clear = function(collectionName, callback) {
//    console.log("Collection target is: " + collectionName);
  this.db.collection(collectionName, function(error, the_collection) {
    if( error ) callback(error);
    else {
      console.log('clearing ' + collectionName);
//      this.db.collection(collectionName).deleteMany({}, function(err, results){
//			     console.log(results);
//                             callback();
//			 });
    }
  });
};

//save new alert 
AlertHandler.prototype.save = function(collectionName, obj, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
      if( error ) callback(error);
      else {
        var push = {};
        var inc = {};
	if (obj.hasOwnProperty("auditLog")){
	    var auditLog = obj['auditLog'];
	    delete obj['auditLog'];
            push['auditLog'] = auditLog;
//            obj[$push] = {'auditLog': auditLog};
            
	}
        if (! (obj.hasOwnProperty("created_at"))){
            obj['created_at'] = new Date(); 	    
	}
	if (!(obj.hasOwnProperty("alertClass"))){
	    obj['alertClass'] = '';
	}
	if (!(obj.hasOwnProperty("name"))){
	    obj['name'] = '';
	}
	if (!(obj.hasOwnProperty("event"))){
	    obj['event'] = '';
	}
        if (obj.hasOwnProperty('count')){
	    var tmpcount = obj['count'];
	    delete obj['count'];
            inc['count'] = tmpcount;
//	    obj[$inc] = {'count': tmpcount};
	} else {
            inc['count'] = 1;
//	    $inc = {'count': 1};
             
	}
        console.log('updating record: ' + util.inspect(obj));
	the_collection.updateOne({
				  'alertClass': obj['alertClass'],
                                  'event': obj['event'],
                                  'name': obj['name']
			      },
                              {
			          $set: obj,
                                  $inc: inc,
                                  $push: push	  
			      },
                              {
				  'upsert': true,
                                  'multi':false
			      }, function(err, results){
				  console.log(results);
                                  callback(null, obj);
			      }
                              
                              );
//        console.log("updating again");
        // the_collection.updateOne(
	//     {
	// 			  'alertClass': obj['alertClass'],
        //                           'event': obj['event'],
        //                           'name': obj['name']
		
	//     },
       
        //     {$inc: {'count': 1}},
        //     {'upsert': true},
        //     function(err, results){
	// 	console.log(results);
        //         callback();
	//     }
	// );
        // the_collection.insert(obj, function() { 
        //   callback(null, obj);
        // });
      }
    });
};

//update a specific object
AlertHandler.prototype.update = function(collectionName, obj, entityId, callback) {
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error);
        else {
            obj._id = ObjectID(entityId); 
            obj.updated_at = new Date(); 
            the_collection.save(obj, function(error,doc) { 
                if (error) callback(error);
                else callback(null, obj);
            });
        }
    });
};

AlertHandler.prototype.get = function(collectionName, id, callback) { 
    this.getCollection(collectionName, function(error, the_collection) {
        if (error) callback(error);
        else {
            var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$"); 
            if (!checkForHexRegExp.test(id)) callback({error: "invalid id"});
            else the_collection.findOne({'_id':ObjectID(id)}, function(error,doc) { 
                if (error) callback(error);
                else callback(null, doc);
            });
        }
    });
};


module.exports = AlertHandler;
