var opentable;
var iam = "stevenk1";

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
    rowtml = ''
    for (key in myobj){
        if (key != "_id") {
            rowtml += '<tr><th>'+ key + '</th><td>' + myobj[key] + '</td></tr>';	    
	}

	console.log(rowtml);
    }

    $('#alertTable').html(rowtml)
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
    
}

    
    $(document).ready(function(){
        //$('#open').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="open"></table>' );
        // $('#all').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="all"></table>' );
        // $('#scheduled').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="scheduled"></table>' );
        // $('#detail').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="detail"></table>' );



        opentable = $("#open").dataTable( {
            "data": openData,
            "columns": [
                {
		  "data": "Severity",
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
                { "data" : "Category"},
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
        $('#open').colResizable();
//        $('#open').resizableColumns();
        var table2 = $("#maintenance").dataTable( {
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

        $(".clickable tbody").on( 'click', 'tr', function () {
            if ( $(this).hasClass('selected') ) {
                $(this).removeClass('selected');
            }
            else {
                opentable.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
           }
           myselected = $('.selected td:nth-child(16)');
           doDetail( myselected.html());
        } );

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
            "audit": {name: "Add to Audit Log", icon: "cut" }
//            "copy": {name: "Copy", icon: "copy"},
//            "paste": {name: "Paste", icon: "paste"},
//            "delete": {name: "Delete", icon: "delete"},
//            "sep1": "---------",
//            "quit": {name: "Quit", icon: "quit"}
        }
    });
    
    $('#open').on('click', function(e){
        console.log('clicked', this);
    })
});

	$('#auditadd').on('click', function(e){
	    e.preventDefault();
	    d = new Date();
	    
	    auditrow = '<tr><td>'+d.toDateString()+" "+d.toTimeString()+'</td><td>stevenk1</td><td>User</td><td>';
	    auditrow += $('#audittext').val() + '</td></tr>'
	    $('#audit tr:last').after(auditrow);
	    $('#audittext').val(""); 
	});


	$('#sndbutton').on('click', function(e){
	    e.preventDefault();
	    auditentry = "Message to: " + $("#To").val();
	    auditentry+= "\nSubject: " + $("#subject").val();
	    auditentry+= "\nMessage: " + $("#notifytext").val();
            auditrow = '<tr><td>'+d.toDateString()+" "+d.toTimeString()+'</td><td>stevenk1</td><td>User</td><td>';
	    auditrow += auditentry + '</td></tr>'
 	    $('#audit tr:last').after(auditrow);
	    $("#To").val("");
	    $("#subject").val("");
	    $("#notifytext").val("")
	    popupthing.close();
	})
    });



