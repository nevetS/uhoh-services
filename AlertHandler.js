var winston = require('winston');
var ObjectID = require('mongodb').ObjectID;

AlertHandler = function(db) {
  this.db = db;
};

//var AlertHandler = function() {
//	this.createAlert = handleCreateAlert;
//	this.getAlerts = handleGetAlerts;
//	this.getActiveAlerts = handleGetActiveAlerts;
//	this.getMaintenanceAlerts = handleGetMaintenanceAlerts;
//	this.updateAlerts = handleUpdateAlerts;
//	this.createAudit = handleCreateAudit;
//};

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
  this.db.collection(collectionName, function(error, the_collection) {
    if( error ) callback(error);
    else callback(null, the_collection);
  });
};


//save new alert 
AlertHandler.prototype.save = function(collectionName, obj, callback) {
    this.getCollection(collectionName, function(error, the_collection) { 
      if( error ) callback(error)
      else {
        obj.created_at = new Date(); 
        the_collection.insert(obj, function() { 
          callback(null, obj);
        });
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

AlertHandler.prototype.handleGetAlerts = function(collectionName, callback) {
    var collection = db.collection('alerts', function(error, the_collection) {
      if( error ) callback(error);
      else {
        collection.find().toArray(function(error, results) {
          if( error ) callback(error);
          else callback(null, results);
        });
      }
    });
};

AlertHandler.prototype.handleCreateAlert = function(collectionName, obj, callback) {
    this.getCollection('alerts', function(error, the_collection) {
      if( error ) callback(error)
      else {
        obj.created_at = new Date();
        the_collection.insert(obj, function() {
          callback(null, obj);
        });
      }
    });
};


AlertHandler.prototype.handleGetActiveAlerts = function(collectionName, callback) {
   db.collection('alerts', function(error, the_collection) {
      if( error ) callback(error);
      else {
        the_collection.find({ "event": "Active" }).toArray(function(error, results) {
          if( error ) callback(error);
          else callback(null, results);
        });
      }
    });
};

AlertHandler.prototype.handleGetMaintenanceAlerts = function(collectionName, callback) {
    this.getCollection('alerts', function(error, the_collection) { 
      if( error ) callback(error);
      else {
        the_collection.find({ "event": "Scheduled Maintenance" } ).toArray(function(error, results) { 
          if( error ) callback(error);
          else callback(null, results);
        });
      }
    });
};

AlertHandler.prototype.handleUpdateAlerts = function(collectionName, obj, entityId, callback) {
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


AlertHandler.prototype.handleCreateAudit = function(collectionName, obj, entityId, callback) {
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

module.exports = AlertHandler;
