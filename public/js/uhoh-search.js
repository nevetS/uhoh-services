/**
 * Version : 0.9
 * Script  : uhoh-code
 * Author  : Steve Kallestad
 * Description : This is a set of javascript code purposed with providing the
 *  user interface for the uhoh project.
 * 
 * 
 */

// Global variables:

var opentable;           //This is the data object associated with the main alerts table
var maintenancetable;    //this is the data object associated with the in maintenance table
var tablesdone;          //This is a boolean flag indicating whether or not table initialization has occured
var iam;                 //Currently logged in user
//TODO: make this an array or add logic to close one popup if another is open
var popupthing;          // dialog window

var mode;                //mode is 
var openData = [];       // this contains the data supporting the open alerts table
var maintenanceData = [];// this contains the data supporting the
                         //  in-maintenance alerts table.
var collapsed = {};
var seen = [];
var socket = {};
var sounds = [];
var soundgroup;
var soundcount = 0;
//TODO: pull this from the environment
//TODO: script build to adjust this per environment
iam = 'stevenk1';

//valid values: docker, test, production
mode = 'test';


/*
 * Merges two arrays based on class, name, and event
 * 
 * If data from the transient array has a matching record in the fixed array,
 * that records count property is incremented.
 * If data from the transient array does not have a matching record, the record
 * is appended to the fixed array
 * 
 * @param {array} arr1 - The fixed array that data is merged into
 * @param {array} arr2 - The transient array that includes new data
 */
function mergeClassNameEvent(arr1,arr2){
//merges records based on Class, Name, and Event
    var addRows = false;
    $.each(arr2,  
	   function(indexy, arr2obj){
	        var arr1obj = $.grep(arr1, function(arr1obj,index){
                    console.log(arr1obj['alertClass'] +' ' + 
                                arr2obj['alertClass']  +' ' + 
                                arr1obj['event']  +' ' + 
                                arr2obj['event']  +' ' + 
				arr1obj['name']  +' ' + 
				arr2obj['name']);

		    return arr1obj['alertClass'] == arr2obj['alertClass'] && 
			   arr1obj['event']      == arr2obj['event'] && 
    		           arr1obj['name']       == arr2obj['name'];
				     });// end $.grep   
	        
                if (arr1obj.length > 0){
		    if(arr1obj['status'] == 'clear'){
			addRows = true;	
		    }
		    $.extend(arr1obj[0], arr2obj);

                    console.log('merging records: ' + arr1obj[0]['count'] + arr2obj['count']);
		} else {
		    arr1.push(arr2obj);
		    addRows = true;
                    console.log('adding records');
		}
	   });// end $.each
     var endLength = arr1.length;
     console.log('merged');
     return addRows;
}

function newOpenData(){
    var myselected = $('#open td:nth-child(14)');
    var Displayed = [];
    myselected.each(function(i,v){
			Displayed.push($(this).text());
		    });
    $.each(openData, function(i,v){
	       if (this['status']== 'active'){
		   if(Displayed.indexOf(this['_id']) == -1){
	               OaddRow(this);	       
		   }	       
	       }
	   });
}

function OaddRow(data){
    var t = opentable.DataTable();
    var rownode = t.row.add(data).draw().node();   
    //t.rows().invalidate().draw();   
    $(rownode).css('color', 'red');
    setTimeout(function(){$(rownode).css('color', 'black');},8000);
    setTimeout(function(){soundcount-=1;},120000);
    if(soundcount < 5){
	sounds[1].play();	
        soundcount += 1;
    }
}

function parseAlerts(results){
    //if the results are not automatically recognized as JSON and parsed,
    // parse them into an object
    console.log('parsing alerts');
    if(!(typeof(results)=="object")){
	console.log("results not an object: "+ typeof(results));
	results = $.parseJSON(results);
	console.log("results parsed: "+ typeof(results))	;
	//return;
    }

  //for each entry within the result set
    $.each(results,function(index,value){
    //if the status is clear, we don't want it.
	       if( value.hasOwnProperty('status') &&  
		   value['status'] == 'clear'
		 ){
                     //skip to next iteration
	//	     return true;
		 }
	       if( value.hasOwnProperty('_id') &&  
		   seen.indexOf(value['_id']) >= 0
		 ){
                     console.log('Already processed alert: ' + value['_id']);
                     //skip to next iteration
		     return true;
		 } else {
                     console.log('Found new alert: ' + value['_id']);
		     seen.push(value['_id']);
		 }

    //required set of columns    
    columns = [ "Acknowledged", 
		    'Owner', 
		    'Class', 
		    'Name', 
		    'Event', 
		    'EventText', 
		    'Source',
		    'Impact',
		    'count', 
		    'LastChange', 
		    'FirstNotify', 
		    'ClearOnAcknowledge', 
		    'EventType', 
		    'Category', 
		    '_id'];

    //add default values for each column
    $.each(columns, function(ind, val){
		 if (!(value.hasOwnProperty(val))){
                     if (val == 'count'){
			 value[val] = 1;
		     } else {
			 value[val] = '';			 
		     }

		 }  
	       });

    if (value['event'] == 'InMaint'){

        mergeClassNameEvent(maintenanceData, [value]);

    } else {

        // if(!(value['count'] > 0)){
	//     value['count'] = 1;
	// }
        mergeClassNameEvent(openData, [value]);


    }
    return true;
  });



    //initialize tables if they have not already been initialized
    doTables();
    
    //redraw the tables
    var t = opentable.DataTable();
    
    t.rows().invalidate().draw();   

    var m = maintenancetable.DataTable();
    m.rows().invalidate().draw();
}


function auditAddEntry(rowid,who,what,when){
//add an audit trail entry to an existing record

    var row = $.grep(openData, function(obj, index){
			 return obj['_id'] == rowid;
		     })[0];
    if($.isArray(row['auditLog'])){
	   row['auditLog'].push({'who':who,'what':what,'when':when});
       } else {
	   var auditLog = [{'who':row['auditLog']['who'], 'what':row['auditLog']['what'], 'when': row['auditLog']['when']}];
           auditLog.push({'who':who,'what':what,'when':when});
           row['auditLog'] = auditLog;
       }
    updateRow(row);
}


function auditAdd(who,what,when){
//add an audit trail entry to the existing on screen table
    console.log('adding audit trail entry');
    var auditrow = '<tr><td>'+when+'</td><td>' + who + '</td><td>';
    auditrow += what + '</td></tr>';
    $('#audit tr:last').after(auditrow);
    $('#audittext').val(""); 

}

function doPoll(){
//poll the server for new alerts
    $.ajax({
           url: '/api/data/1.1/alerts/alerts',
           //url: 'alerts.js',
           headers: {Accept : "text/plain; charset=utf-8"},
           success: parseAlerts
           
    });

}
function findAlertq(query){
   var retData = false;

   var myobj =  $.grep(openData, function (n, i){
		      return n.name == query.name && n.event == query.event && n.alertClass == query.alertClass;
		  });
  if (myobj.length > 0){
    retData = myobj[0]._id;
  }
  return retData;
}
function findAlert(id){
  //return the row in openData that is associated with a given id
  return $.grep(openData, function (n, i){
    return n._id == id;
  });
}
function idFromCell(cell){
    //return the id(which is in the last column) from any given cell
    return $(cell).siblings(":last").html();
}
function redrawTables(){
    var t = opentable.DataTable();
    var m = maintenancetable.DataTable();
    t.rows('.deleteme').remove().draw();
    m.rows('.deleteme').remove().draw();
}

function collapse(selected){
    
}
function expand(){
    
}

function doMaintenance(id, cell){
    console.log("putting host into maintenance");
    var row = findAlert(id)[0];
    row['event'] = 'InMaint';
    var m = maintenancetable.DataTable();
    m.row.add(row);
//    var d = m.data();
//    d.push(row);
//    d.rows().invalidate().draw();
    maintenanceData.push(row);
    removeByID(openData, id);
    var tableRow = $(cell).parent();
    tableRow.addClass('deleteme');
    updateRow(row);
    redrawTables();
}

function doClear(id, cell){
    var row = findAlert(id)[0];
    row['status'] = 'clear';
    var tableRow = $(cell).parent();
    tableRow.addClass('deleteme');
    updateRow(row);
    redrawTables();
    
}

function removeMaintenance(id, cell){
    console.log("removing host from maintenance");


    var row = $.grep(maintenanceData, function(n, i){
		     return n._id == id;
		 })[0];
    row['status'] = 'clear';
    updateRow(row);
    //removeByID(maintenanceData, id);
    maintenanceData = $.grep(maintenanceData, function(value){
				 if (value['_id'] != id){
				     return true;
				 } else {
				     return false;
				 }
			     });
//    updateRow(row);
    var tableRow = $(cell).parent();
    tableRow.addClass('deleteme');
    redrawTables();
}
function removeByID(arr, id){

    openData = $.grep(arr, function(value){
		     if  (value['_id']!= id){
			 return true;
		     } else {
			 return false;
		     }
		 });
    
}
function highlightCount(id){
    var node = $("td").filter(function() { 
				  return $(this).text() == id;
			      });
    var p = node.parent();

    var count = p.children()[8];
    $(count).css('color','red');    
    setTimeout(function(){$(count).css('color', 'black');},8000);
    setTimeout(function(){soundcount-=1;},120000);
    if(soundcount < 5){
	sounds[0].play();   
	soundcount += 1;
    }
}

function countActive(){
   var ac = 0;
    $.each(openData, function(i,v){
	       if (v['status'] == 'active'){
		   ac += 1;
	       }
	   });
   return ac;
}
function doSocket(){
    var url = window.location.protocol + '//' + window.location.hostname+(location.port ? ':'+location.port: '') + "/"; 
    
    socket = io.connect(url);
    console.log('connecting to socket at ' + url);
//    io.set("polling duration", 10);
//    io.set("close timeout", 30);
    socket.on('news', function(data){
	  console.log('received news:' + data);
          console.log(data);
	  });    
    socket.on('update', function(data){
		  console.log('received an update');
		  console.log(data);
                  var mAdd = 0;
                  var oAdd = false;
		  if('event' in data){
		      if(data['event'] == 'InMaint'){
			  mAdd = mergeClassNameEvent(maintenanceData, [data]);
		      } else {
			  var acb = countActive();
			  mergeClassNameEvent(openData, [data]);
			  if (acb < countActive()){
			      oAdd = true;
			  }
			  if(oAdd){
			      newOpenData();  
			  } else {
			      var updated = findAlertq(data);
			      highlightCount(updated);
			  }
		      }
		  }
    
		  //redraw the tables
		  var t = opentable.DataTable();


		  t.rows().invalidate().draw();   
		  
		  var m = maintenancetable.DataTable();
		  m.rows().invalidate().draw();

	      });
    socket.on('insert', function(data){
		  console.log('received a new record');
                  console.log(data);
		  if('event' in data){
		      if(data['event'] == 'InMaint'){
			  mergeClassNameEvent(maintenanceData, [data]);
		      } else {
			  mergeClassNameEvent(openData, [data]);
		      }
		  }
		  //initialize tables if they have not already been initialized
		  doTables();
    
		  //redraw the tables
		  var t = opentable.DataTable();
		  
		  t.rows().invalidate().draw();   
		  
		  var m = maintenancetable.DataTable();
		  m.rows().invalidate().draw();
	      });
}

function doDetail(id){
    //display detail information and audit trail information

    myobj = findAlert(id)[0];
    rowtml = '';
    $('#audit').find("tr:gt(0)").remove();
    var skip = ['_id','auditLog'];
    for (key in myobj){

        if (key == 'auditLog'){
            console.log('doing audit');
            if($.isArray(myobj[key])) {
		var counter = 0;
		$.each(myobj['auditLog'], function(index,obj){
			   counter +=1
			   auditAdd(obj['who'],obj['what'],obj['when']);					   
			   if (counter > 100){
			       return false;
			   }
		       });
	    } else {
		auditAdd(myobj['auditLog']['who'],myobj['auditLog']['what'],myobj['auditLog']['when']);					   
	    }

	    continue;
	}
        if (key != "_id") {
            rowtml += '<tr><th>'+ key + '</th><td>' + myobj[key] + '</td></tr>';	    
	}


    }
	console.log(rowtml);
    $('#alertTable').html(rowtml);
} 


function acknowledgeAlert(id, cell){
    row = findAlert(id);
    row[0]["Acknowledged"] = "Yes";
    if(row[0]['clearOnAck'] == true || row[0]['clearOnAck'] == "true"){
	row[0]['status'] = 'clear';
        removeByID(openData, id);
        var tableRow = $(cell).parent();
        tableRow.addClass('deleteme');
    }
    t = opentable.DataTable();
    redrawTables();
    t.rows().invalidate().draw();   
    updateRow(row[0]);
}
function unackAlert(id){
    row = findAlert(id);
    row[0]["Acknowledged"] = "No";
    t = opentable.DataTable();
    t.rows().invalidate().draw();   
    updateRow(row[0]);
}
function takeOwnership(id){
    row = findAlert(id);
    row[0]["Owner"] = iam;
    updateRow(row[0]);
    t = opentable.DataTable();
    t.rows().invalidate().draw();   

}
function releaseOwnership(id){
    row = findAlert(id);
    row[0]["Owner"] = "";
    t = opentable.DataTable();
    t.rows().invalidate().draw();   
    updateRow(row[0]);
}


function updateRow(row){
    var url = "/api/data/1.1/alerts/alerts/" + row['_id'];
    var date = new Date();
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    var hour = date.getHours();
    var min = date.getMinutes();
    var when = day + '/' + day + '/' + year + " " + hour + ':' + min;


    row['LastChange'] = when;

    if(row['status'] == "clear"){
	row['Owner'] = '';
    }
    var adata = JSON.stringify(row);
    console.log("updating row " + row['_id'] + "with data: "+adata);
    var atype = "PUT";
    var acontentType = "application/json; charset=utf-8";
    var adataType = "json";
    //toDO update Date
    if(mode == 'development'){
        //don't do ajax in dev mode
	return;
    }
    
    //update the record in the database
    $.ajax({
	       type: atype,
               url: url,
               contentType: acontentType,
               dataType: adataType,
               data: adata
	   });

}

function doEmail(){
    var maildata = {};
    maildata['to'] = $("#To").val();
    maildata['subject'] = $("#subject").val();
    maildata['message'] = $("#notifytext").val();
    maildata['from'] = "noreply@stanford.edu";

    var adata = JSON.stringify(maildata);
    var atype = "POST";
    var url = "/api/utils/1.1/mail";
    var acontentType = "application/json; charset=utf-8";
    if(!(mode == 'development')){
	   $.ajax({
		      type: atype,
		      url: url,
		      contentType: acontentType,
		      dataType: adataType,
		      data: adata
		  });
	   
       }

}

function selectFun(e){
    console.log('clicked row number ' + ($(this).index()+1));



    var tbody = $(this).parent();
    
    var lastSelected;
    $(tbody).children('tr').each(function (index){
                        if($(this).hasClass('lastSelected')){
			   lastSelected = index + 1 ;
                           return false;
			}
			    return true;

                        } );

    console.log('last selected is ' + lastSelected);
    //unselect other rows unless meta or shift are pressed
    if(!(e.metaKey) && !(e.shiftKey)){
	$(tbody).children('tr').removeClass('selected');
    }

    //select current row
    if($(this).hasClass('selected') ){
	$(this).removeClass('selected');
    } else {
	$(this).addClass('selected');
    }

    //add lastSelected to current row, remove from everywhere else
    $(tbody).children('tr').removeClass('lastSelected');
    $(this).addClass('lastSelected');


    if(e.shiftKey){
        var start = Math.min(lastSelected, $(this).index());
        var end = start + Math.abs($(this).index() - lastSelected) + 1;
        console.log('slicing from ' + start + ' to ' + end);
	$(tbody).children('tr').slice(start,end).addClass('selected');
        //remove selection from all rows up to start point
	$(tbody).children('tr').slice(0,start-1).removeClass('selected');
	//remove selection from all rows after end point
        $(tbody).children('tr').slice(end).removeClass('selected');
    }
    
    var myselected = $('.selected td:nth-child(14)');
    doDetail(myselected.html());
    
}

function doTables(){
    if (tablesdone == true){
	return;
    }
    opentable = $("#open").dataTable( {
	    "data": openData,
            "columns": [
                {
		  "data": "severity",
                  "render": function (data, type, row ){
		    if (data == "1") { return '<center><i class="fa fa-fire red"></i></center>';}
                    else if (data == "2") { return '<center><i class="fa fa-bolt"></i></center>';}
                    else if (data == "3") { return '<center><i class="fa fa-exclamation-triangle"></i></center>';}
                    else if (data == "4") { return '<center><i class="fa fa-times-circle"></i></center>';}
		    else {
			return '';
		    }

                    return '<center>' + data + '</center>';
		  },


		},
                { "data" : "Acknowledged"},
                { "data" : "Owner"},
                { "data" : "alertClass"},
                { "data" : "name",
                  "render": function (data, type, row){
		      return '<a target="_blank" href="https://netw-tools.stanford.edu/cgi-bin/lkup.cgi?device='+ 
                             data + '&lookupAction=getProcedure&devsearch=search">'+ 
                             data + '</a>';
		  }
                },
                
                { "data" : "event"},
                { "data" : "text"},
                { "data" : "source"},
//                { "data" : "Impact"},
                { "data" : "count"},
                { "data" : "LastChange"},
                { "data" : "created_at"},
                { "data" : "clearOnAck"},
                { "data" : "EventType"},
//                { "data" : "category"},
                { "data" : "_id"}
             ],
            "paging": false,
            "searching": true,
            "createdRow": function (row, data, index){
                if (data["severity"] == "1"){
		    $(row).addClass('danger');
		} else if(data["severity"] == "2"){
		    $(row).addClass('op');
		} else if(data["severity"] == "3"){
		    $(row).addClass('warning');
		} else if(data["severity"] == "4"){
		    $(row).addClass('info');
		} 

                }


        });

        $(".clickable tbody").on( 'click', 'tr', selectFun);
           // function (e) {
	   //  console.log('clicked row number ' + ($(this).index() + 1));
           //  if ( $(this).hasClass('selected') ) {
           //      $(this).removeClass('selected');
           //  }
           //  else {
           //      if(!(e.metaKey) && (!(e.shiftKey))){
           //          opentable.$('tr.selected').removeClass('selected');		    
	   // 	}

           //      $(this).addClass('selected');
           // }
           // var myselected = $('.selected td:nth-child(16)');
           // doDetail( myselected.html());
        //} );


        $('#open').colResizable();


        maintenancetable = $("#maintenance").dataTable( {
        "data": maintenanceData,
        "columns": [
            { "data" : "alertClass"},
            { "data" : "event"},
            { "data" : "name"},

            { "data" : "text"},
            { "data" : "count"},
            { "data" : "LastChange"},
            { "data" : "_id"}
],
"paging": false,
"searching": true,
"createdRow": function(row, data, index){
    $(row).addClass('success');
}
        });

        $('#maintenance').colResizable();





   tablesdone = true;
}

function pop_config(){
    console.log('opening configuration dialog');
    popupthing = $('#configure_dialog').bPopup();	
}

function setVolume(){
    var vol = $('#volume')[0];
    var level = vol.noUiSlider.get();
    soundgroup.setVolume(level);
    console.log("Setting volume to:" + level);
}
function initialize_sliders(){
    noUiSlider.create($('#volume')[0], {
			  start: 80,
			  connect: "lower",
			  orientation: "horizontal",
			  range: {
			      'min': 0,
			      'max': 100
			  },
			  step: 1,
			  format:{
	  to: function ( value ) {
		return value;
	  },
	  from: function ( value ) {
		return value;
	  }
	}
			  
		      } );

    $('#volume')[0].noUiSlider.on('change', setVolume);
}

function init(){
    //initialization routines
    doPoll();
    $('#auditadd').on('click', function(e){
			  e.preventDefault();
			  d = new Date();
			  when = d.toDateString()+" "+d.toTimeString();
			  who = iam;
			  what = $('#audittext').val();	    
			  auditAdd(who,what,when);
			  rowid = $('.selected').children(":last").html();
			  auditAddEntry(rowid,who,what,when);
			  console.log(rowid);
			  $('#audittext').val(""); 
            
		      });

    $('#sndbutton').on('click', function(e){
			   e.preventDefault();
                           var d = new Date();
			   var when = d.toDateString()+" "+d.toTimeString();
			   var auditentry = "Notification sent:\n To: " + $("#To").val() + "\n";
			   auditentry+= "\nSubject: " + $("#subject").val() + "\n";
			   auditentry+= "\nMessage: " + $("#notification_text").val() + "\n";
                           auditAdd(iam,auditentry,when);
                           auditAddEntry($("#notifyrow").val(),iam,auditentry,when);
			   $("#To").val("");
			   $("#subject").val("");
			   $("#notification_text").val("");
                           doEmail();
			   popupthing.close();
		       });

   $.contextMenu({
		     selector: '#open tr td', 
		     callback: function(key, options) {
			 var m = "clicked: " + key;
			 var id = idFromCell(options.$trigger);
                         var selected = $('.selected');
			 console.log("id was clicked: " + id);
//			 window.console && console.log(m) || alert(m);
			 if(key == "notify"){
			     console.log("notifying");
                             row = findAlert(id)[0];
                             subject = "Alert: " + row['name'];
                             var skip = ['_id', 'auditLog'];
                             message = "\n\n";
                             for (key in row){
				 if (skip.indexOf(key) == -1){
				     message += key + ": " + row[key] + "\n";
				 }
			     }
                             $("#subject").val(subject);
                             $('#notifyrow').val(id);
                             $("#notification_text").val(message);
			     popupthing = $('#email_dialog').bPopup();	
			 } else if (key=="ack"){
                             if(selected.length > 0){
				 $.each(
				     selected, function(index,obj){
					 var mytd = $(obj).children(":last");
   					 acknowledgeAlert(mytd.html(), mytd); 				     
				     }
				 );
				 
			     } else {
				 acknowledgeAlert(id, options.$trigger); 				 
			     }

			 } else if (key=="unack"){
			     if(selected.length > 0 ){
				 $.each(
				     selected, function(index,obj){
					 var mytd = $(obj).children(":last");
   					 unackAlert(mytd.html()); 				     
				     }
				 );
				 
			     } else {
				 unackAlert(id);				 
			     }

			 } else if (key=="own"){
			     if(selected.length > 0){
				 $.each(
				     selected, function(index,obj){
					 var mytd = $(obj).children(":last");
   					 takeOwnership(mytd.html()); 				     
				     }
				 );
				 
			     } else {
				 takeOwnership(id); 
			     }
			 } else if (key=="unown"){
			     if(selected.length > 0){
				 $.each(
				     selected, function(index,obj){
					 var mytd = $(obj).children(":last");
   					 releaseOwnership(mytd.html()); 				     
				     }
				 );
				 
			     } else {
				 releaseOwnership(id);
			     }
			 } else if (key =="inmaint"){
			     doMaintenance(id, options.$trigger);
			 } else if (key =="clear"){
			     if(selected.length > 0){
				 $.each(
				     selected, function(index,obj){
					 var mytd = $(obj).children(":last");
   					 doClear(mytd.html(), mytd); 				     
				     }
				 );
				 
			     } else {
				 doClear(id, cell);
			     }

			 }

		     },
		     items: {
//			 "clear":{name: "Clear Alert", icon: "cut"},
			 "notify": {name: "Send Notification", icon: "edit"},
//			 "ack": {name: "Acknowledge", icon: "cut"},
//			 "unack": {name:"Unacknowledge", icon: "cut" },
//			 "own": {name: "Take Ownership", icon: "cut" },
//			 "unown": {name: "Release Ownership", icon: "cut" },
			 "audit": {name: "Add to Audit Log", icon: "cut" }
//			 "inmaint":{name: "put in maintenance", icon: "cut"}

		     }
		 });


    $.contextMenu({
		      selector: '#maintenance tr td', 
		      callback: function(key, options) {
			  var m = "clicked: " + key;
			  var id = idFromCell(options.$trigger);
			  console.log("id was clicked: " + id);
			  window.console && console.log(m) || alert(m);
			  if(key == "notify"){
			      console.log("notifying");
			      popupthing = $('#email_dialog').bPopup();	
			  } else if (key=="ack"){
			      acknowledgeAlert(id); 
			  } else if (key=="unack"){
			      unackAlert(id);
			  } else if (key=="outmaint"){
			      removeMaintenance(id, options.$trigger);
			  }
			  
		      },
		      items: {
			  "notify": {name: "Send Notification", icon: "edit"},
			  "audit": {name: "Add to Audit Log", icon: "cut" },
			  "outmaint":{name: "out of maintenance", icon: "cut"}
		      }
		  });

    $('#config-link').on('click', null, pop_config);
    initialize_sliders();
    sounds.push(new buzz.sound('/sounds/click.wav'));
    sounds.push(new buzz.sound('/sounds/ding.wav'));
    sounds.push(new buzz.sound('/sounds/ohno.wav'));
    soundgroup = new buzz.group(sounds[0], sounds[1], sounds[2]);
 //   doSocket();

}

$(document).ready(function(){
		      init();
		  });