var opentable;
var maintable;
var table2;
var openData = [];
var maintenanceData = [];
var tablesdone = false;
var iam = "stevenk1";

function mergeClassNameEvent(arr1,arr2){
    $.each(
            arr2,  
        function(indexy, arr2obj){
	        var arr1obj = $.grep(arr1, function(arr1obj,index){
                    console.log(arr1obj['alertClass'] +' ' + arr2obj['alertClass']  +' ' + arr1obj['event']  +' ' + arr2obj['event']  +' ' + arr1obj['name']  +' ' + arr2obj['name']);

		    return arr1obj['alertClass'] == arr2obj['alertClass'] && arr1obj['event'] == arr2obj['event'] && arr1obj['name'] == arr2obj['name'];
	        });   
                if (arr1obj.length > 0){
		    $.extend(arr1obj[0], arr2obj[0]);
                    arr1obj[0]['count'] += 1;
                    console.log('merging records: ' + arr1obj[0]['count'] + arr2obj['count']);
		} else {
		    arr1.push(arr2obj);
                    console.log('adding records');
		}
	   });
console.log('merged');
       
}

function parseAlerts(results){
    if(!(typeof(results)=="object")){
	console.log("results not an object: "+ typeof(results));
	results = $.parseJSON(results);
	console.log("results not an object: "+ typeof(results))	;
	//return;
    }
  $.each(results,function(index,value){
    if( value.hasOwnProperty('status') &&  
        value['status'] == 'clear'
    ){
	return false;
    }
    console.log(value['_id']);
    if (value['event'] == 'InMaint'){
        columns = [ "Acknowledged", 'Owner', 'Class', 'Name', 'Event', 'EventText', 'Source','Impact','count', 'LastChange', 'FirstNotify', 'ClearOnAcknowledge', 'EventType', 'Category', '_id'];
        $.each(columns, function(ind, val){
		 if (!(value.hasOwnProperty(val))){
                     if (val == 'count'){
			 value[val] = 1;
		     }
		     value[val] = '';
		 }  
	       });
        mergeClassNameEvent(maintenanceData, [value]);
        console.log(value['event'] + 'maintenance');
    } else {
        columns = [ "Acknowledged", 'Owner', 'Class', 'Name', 'Event', 'EventText', 'Source','Impact','count', 'LastChange', 'FirstNotify', 'ClearOnAcknowledge', 'EventType', 'Category', '_id'];
        $.each(columns, function(ind, val){
		 if (!(value.hasOwnProperty(val))){
                     if (val == 'count'){
			 value[val] = 1;
		     }
		     value[val] = '';
		 }  
	       });
        if(!(value['count'] > 0)){
	    value['count'] = 1;
	}
        mergeClassNameEvent(openData, [value]);
        console.log('alert');

    }
    return true;
  });
    doTables();
    var t = opentable.DataTable();
    
    t.rows().invalidate().draw();   

    var m = table2.DataTable();
    m.rows().invalidate().draw();
}

function auditAddEntry(rowid,who,what,when){
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
    console.log('adding audit trail entry');
    var auditrow = '<tr><td>'+when+'</td><td>' + who + '</td><td>';
    auditrow += what + '</td></tr>';
    $('#audit tr:last').after(auditrow);
    $('#audittext').val(""); 

}

function doPoll(){
    $.ajax({
           url: '/alerts',
           //url: 'alerts.js',
           headers: {Accept : "text/plain; charset=utf-8"},
           success: parseAlerts
           
    });
    setTimeout(doPoll,300000);
}


function findAlert(id){
  return $.grep(openData, function (n, i){
    return n._id == id;
  });
}
function idFromCell(cell){
    return $(cell).siblings(":last").html();
}
function doDetail(id){
    myobj = findAlert(id)[0];
    rowtml = '';
    $('#audit').find("tr:gt(0)").remove();
    var skip = ['_id','auditLog'];
    for (key in myobj){

        if (key == 'auditLog'){
            console.log('doing audit');
            if($.isArray(myobj[key])) {
		$.each(myobj['auditLog'], function(index,obj){
			   auditAdd(obj['who'],obj['what'],obj['when']);					   
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


function acknowledgeAlert(id){
    row = findAlert(id);
    row[0]["Acknowledged"] = "Yes";
//    openData[row]["Acknowledged"] = "Yes";
    t = opentable.DataTable();
    t.rows().invalidate().draw();   
    updateRow(row);
}
function unackAlert(id){
    row = findAlert(id);
    row[0]["Acknowledged"] = "No";
    t = opentable.DataTable();
    
    t.rows().invalidate().draw();   
    updateRow(row);
}
function takeOwnership(id){
    row = findAlert(id);
    row[0]["Owner"] = iam;
    t = opentable.DataTable();
    
    t.rows().invalidate().draw();   
    updateRow(row);
}
function releaseOwnership(id){
    row = findAlert(id);
    row[0]["Owner"] = "";
    t = opentable.DataTable();
    
    t.rows().invalidate().draw();   
    updateRow(row);
}
function openAudit(id){
    
}
function addToAudit(id){
    
}
function updateRow(row){
    var url = "/alerts/" + row['_id'];
    var adata = JSON.stringify(row);
    console.log("updating row " + row['_id'] + "with data: "+adata);
    var atype = "PUT";
    var acontentType = "application/json; charset=utf-8";
    var adataType = "json";
    $.ajax({
	       type: atype,
               url: url,
               contentType: acontentType,
               dataType: adataType,
               data: adata
	   });

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
		    

                    return '<center>' + data + '</center>';
		  }

		},
                { "data" : "Acknowledged"},
                { "data" : "Owner"},
                { "data" : "alertClass"},
                { "data" : "name",
                  "render": function (data, type, row){
		      return '<a target="_blank" href="https://netw-tools.stanford.edu/cgi-bin/lkup.cgi?device='+ data + '&lookupAction=getProcedure&devsearch=search">'+ data + '</a>';
		  }
                },
                
                { "data" : "event"},
                { "data" : "text"},
                { "data" : "source"},
                { "data" : "Impact"},
                { "data" : "count"},
                { "data" : "LastChange"},
                { "data" : "created_at"},
                { "data" : "clearOnAck"},
                { "data" : "EventType"},
                { "data" : "category"},
                { "data" : "_id"}
             ],
            "paging": false,
            "searching": true,
            "createdRow": function (row, data, index){
                if (data["Severity"] == "1"){
		    $(row).addClass('danger');
		} else if(data["Severity"] == "2"){
		    $(row).addClass('op');
		} else if(data["Severity"] == "3"){
		    $(row).addClass('warning');
		} else if(data["Severity"] == "4"){
		    $(row).addClass('info');
		} 

                }


        });

        $(".clickable tbody").on( 'click', 'tr', function (e) {
            if ( $(this).hasClass('selected') ) {
                $(this).removeClass('selected');
            }
            else {
                if(!(e.metaKey) && (!(e.shiftKey))){
                    opentable.$('tr.selected').removeClass('selected');		    
		}

                $(this).addClass('selected');
           }
           myselected = $('.selected td:nth-child(16)');
           doDetail( myselected.html());
        } );


        $('#open').colResizable();
   tablesdone = true;
}
   

    
    $(document).ready(function(){
        //$('#open').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="open"></table>' );
        // $('#all').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="all"></table>' );
        // $('#scheduled').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="scheduled"></table>' );
        // $('#detail').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="detail"></table>' );

        doPoll();

//        $('#open').resizableColumns();
        table2 = $("#maintenance").dataTable( {
        "data": maintenanceData,
        "columns": [
            { "data" : "Class"},
            { "data" : "Event"},
            { "data" : "Name"},

            { "data" : "EventText"},
            { "data" : "Count"},
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


        var allData = $.merge([],openData);
        $.merge(allData,maintenanceData);
        var table3 = $("#allData").dataTable( {
        "data": allData,
        "columns": [
            { "data" : "Acknowledged"},
            { "data" : "Owner"},
            { "data" : "Class"},
            { "data" : "Name"},
            { "data" : "Event"},
            { "data" : "EventText"},
            { "data" : "Source"},
            { "data" : "Impact"},
            { "data" : "Count"},
            { "data" : "LastChange"},
            { "data" : "FirstNotify"},
            { "data" : "ClearOnAcknowledge"},
            { "data" : "EventType"},
          ]
        });

        $('#allData').colResizable();




var popupthing;
$(function(){
    $.contextMenu({
        selector: '#open tr td', 
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
            }

        },
        items: {
            "notify": {name: "Send Notification", icon: "edit"},
            "ack": {name: "Acknowledge", icon: "cut"},
            "unack": {name:"Unacknowledge", icon: "cut" },
            "own": {name: "Take Ownership", icon: "cut" },
            "unown": {name: "Release Ownership", icon: "cut" },
            "audit": {name: "Add to Audit Log", icon: "cut" },
            "inmaint":{name: "put in maintenance", icon: "cut"}
//            "copy": {name: "Copy", icon: "copy"},
//            "paste": {name: "Paste", icon: "paste"},
//            "delete": {name: "Delete", icon: "delete"},
//            "sep1": "---------",
//            "quit": {name: "Quit", icon: "quit"}
        }
    });
    
    $('#open').on('click', function(e){
        console.log('clicked', this);
    });
});

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
	    auditentry = "Message to: " + $("#To").val();
	    auditentry+= "\nSubject: " + $("#subject").val();
	    auditentry+= "\nMessage: " + $("#notifytext").val();
            auditrow = '<tr><td>'+d.toDateString()+" "+d.toTimeString()+'</td><td>stevenk1</td><td>User</td><td>';
	    auditrow += auditentry + '</td></tr>';
 	    $('#audit tr:last').after(auditrow);
	    $("#To").val("");
	    $("#subject").val("");
	    $("#notifytext").val("");
	    popupthing.close();
	});
    });



