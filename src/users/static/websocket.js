$(document).ready(function() {

	// Set Constants
	var INIT 	= 0;
	var PUSH 	= 1;
	var PULL 	= 2;
	var PULSE 	= 3
	var ASSERT 	= 4;
	var SYNC	= 5;

	var FC_THRESHOLD = 4; // Find co-ordinator threshold
	var PS_THRESHOLD = 4; // Push threshold

	var HB_INTERVAL = 5000;

	// Get file path and other info from elements
	var processId = $("#processIdTag").data("id");
	//var project = $("#projectNameTag").data("name");
	var project = "test";
	//var file = $("#fileNameTag").data("name");
	var file = "test";
	var csrf = $("#tokenTag").data("token");
	console.log(csrf);

	// Set Globals
	/*var ws = new WebSocket('ws://localhost:8000/ws/' +
				project + '-' +
				file + '?subscribe-broadcast&publish-broadcast&echo'
	);*/
	var ws = new WebSocket('ws://localhost:8000/ws/foobar?subscribe-broadcast&publish-broadcast&echo');

	// Set heartbeat JSON
	var heartbeat_interval = null;
	var heartbeat_data = {};
	heartbeat_data["id"] = processId;
	heartbeat_data["message_id"] = PULSE;
	heartbeat_data["message"] = "--beat--";
	var heartbeat_message = JSON.stringify(heartbeat_data);
	console.log(heartbeat_message);
	// Initialize heartbeat values
	var missed_heartbeats = 0;
	var caught_heartbeats = 0;
	// Initialize code base array
	var code_array = new Array();
	// Initialize co-ordinator variables and set to false
	var is_announced = false;
	var is_coordinator = false;
	var found_coordinator = false;
	var election_called = false;

	// Get current code file
	/*$.ajax({
		method: "POST",
		url: "/app/load-code",
		data: {
			project: project,
			file: file,
			csrfmiddlewaretoken: csrf
		},
		success: function(data) {
			// Set codemirror to current code and initialize first code for comparison
			code_codemirror.setValue(data);
			code_array.push(data);
			console.log("Code retrieved successfully.");
		}
	});*/

	var code_snippet = "def greet(name):\n" +
		"       print('Hello', name)\n" +
		"greet('Jack')\n" +
		"greet('Jill')\n" +
		"greet('Bob')\n";

	code_codemirror.setValue(code_snippet);
	code_array.push(code_snippet);

	// Logs output in browser and IDE console
	function consoleOutput(msg) {
		console.log(msg);
		var console_output = $("#console").html();
		console_output += msg;
		$("#console").html(console_output);
	}

	// Announces presence of new process
	function initializeCommunication() {
		// Initialize Array
		var data = {};
		// Set values for check-in
		data["id"] = processId;
		data["message_id"] = INIT;
		data["message"] = "New processes initialized.";
		// Get JSON string
		var json = JSON.stringify(data);
		ws.send(json);
	}

	// Handles connection to Redis server
	function handleConnection() {
		// Set console message
		var msg = "Websocket is connecting...\n";
		consoleOutput(msg);
		return;
	}

	// Handles opening of redis connection
	function handleOpen() {
		// Set console message
		var msg = "Websocket Status: Open\n";
		consoleOutput(msg);
		// Set heartbeat interval
		if( heartbeat_interval === null ) {
			missed_heartbeats = 0;
			heartbeat_interval = setInterval(function() {
				// Count missed heartbeats
				try {
					missed_heartbeats++;
					if( missed_heartbeats >= 4 ) {
						throw new Error("Too many missed heartbeats");
					}
					ws.send(heartbeat_message);
				} catch(e) {
					// On failure, clear current heartbeat interval
					clearInterval(heartbeat_interval);
					heartbeat_interval = null;
					// Set console message
					var msg = "Websocket Status: Too many missed heartbeats.\n"
					consoleOutput(msg);
					// Close websocket
					ws.close();
				}
			}, HB_INTERVAL);
		}
	}

	// Awaits responses and determines co-ordinator upon intialization
	ws.onmessage = function(e) {
		var data = e.data;
		var json = JSON.parse(data);

		var pId = json["id"];
		var mId = json["message_id"];
		var msg	= json["message"];

		console.log("Received: " + pId + "-" + mId);
		// Track heartbeats
		if( mId == PULSE && pId == processId ) {
			missed_heartbeats = 0;
			caught_heartbeats++;
		}
		if( !is_announced ) {
			initializeCommunication();
			is_announced = true;
		}
		// Determine co-ordinator if not found
		if( !found_coordinator ) {
			// Wait 4 heartbeats
			if( caught_heartbeats >= FC_THRESHOLD ) {
				caught_heartbeats = 0;
				// Announce lack of co-ordinator
				console.log("Co-ordinator not found. Initiating electing.");
				// Set co-ordinator variables to true
				is_coordinator = true;
				found_coordinator = true;
				// TEMP - Assert coordinator-ness
				var response = {};
				response["id"] = processId;
				response["message_id"] = ASSERT;
				response["message"] = "I am the co-ordinator";
				// Create JSON string from response
				var json_response = JSON.stringify(response);
				ws.send(json_response);
				// Set message handling behaviour to co-ordinator
				ws.onmessage = function(e) {
					// Get JSON array
					var data = e.data;
					var json = JSON.parse(data);
					// Get message values
					var pId = json["id"];
                			var mId = json["message_id"];
                			var msg = json["message"];

					console.log("Recevied: " + pId + "-" + mId);
                			// Check for own heartbeat
                			if( mId == PULSE && pId == processId ) {
                		        	// Clear missed heartbeats
                        			missed_heartbeats = 0;
                        			// Increment caught heartbeats
                        			caught_heartbeats++;
					} else if( mId == INIT ) {
						// Create response array
						var response = {};
						// Set response values
						response["id"] = processId;
						response["message_id"] = ASSERT;
						response["msg"] = "I am the co-ordinator";
						// Create JSON string from response
						var json_response = JSON.stringify(response);
						ws.send(json_response);
                			} else if( mId == PULL ) {
                        			// Get current base
                        			var index = code_array.length - 1;
                        			var base_code = code_array[index];
                        			// Create response array
                        			var response = {};
                        			// Set response values
                        			response["id"] = processId;
                        			response["message_id"] = SYNC;
                        			response["target"] = pId;
                        			response["msg"] = base_code;
                        			// Create JSON string from respons
                        			var json_response = JSON.stringify(response);
                        			ws.send(json_response);
                			} else if( mId == PUSH ) {

					}
      				}
				return;
			} else if( mId == ASSERT ) {
				caught_heartbeats = 0;
				// Announce found co-ordinator
				console.log("Found co-ordinator.");
				// Set co-ordinator variables to true
				found_coordinator = true;
				// Set message handling behaviour to participant
				ws.onmessage = function(e) {
					// Get JSON array
			                var data = e.data;
                			var json = JSON.parse(data);
                			// Get message values
                			var pId = json["id"];
                			var mId = json["message_id"];
                			var msg = json["message"];
                			// Check for own heartbeat
					console.log("Received: " + pId + "-" + mId);
                			if( mId == PULSE && pId == processId ) {
                			        // Clear missed heartbeats
                        			missed_heartbeats = 0;
                        			// Increment caught heartbeats
                        			caught_heartbeats++;
                        			if( caught_heartbeats >= PS_THRESHOLD ) {
							caught_heartbeats = 0;
                                			// Create response array
                                			var response = {};
                                			// Get current code
                                			var code = code_codemirror.getValue();
                                			// Set response values
                                			response["id"] = processId;
                                			response["message_id"] = PUSH;
                                			response["message"] = code;
							// Create JSON from response
							var json_response = JSON.stringify(response);
							ws.send(json_response);
                                			return;
                        			}
			                } else if ( mId == SYNC ) {
                        			// Log request to console
                        			var log = "Sync request received. Updating code base.";
                        			consoleOutput(log);
                        			// Set new code to active code
                        			code_codemirror.setValue(msg);
                        			return;
                			}
				}
			}
		}
	}

	// Handles code merging
	function handleMerge(data) {
		// Get co-ordinator code and contributor code
		var current_code = code_codemirror.getValue();
		var merge_code = data;
		// Initial diff_match_patch
		var dmp = new diff_match_patch();
		// Get difference in code
		var diff = dmp.diff_main(current_code, merge_code);
		// Create patch to resolve differences
		var patch = dmp.patch_make(current_code, merge_code, diff);
		// Apply patches
		var result = dmp.patch_apply(patch, current_code)
		console.log(result[0]);
		return result[0];
	}

	handleMerge("test");

	ws.onerror = function(e) {
		var log = 'Websocket Error: ' + e + '\n';
		consoleOutput(log);
	}

	ws.onclose = function(e) {
		var log = 'Websocket Status: Closed\n';
		consoleOutput(log);
	}

	// Set callbacks
	ws.onconnecting = handleConnection();
	ws.onopen = handleOpen();

	$("#runBtn").click(function() {
		var code = code_codemirror.getValue();
		$.ajax({
			method: "POST",
			url: "/app/run/",
			data: {
				"code": code,
				"csrfmiddlewaretoken": csrf
			},
			success: function(data) {
				consoleOutput("Running code...\n");
				consoleOutput(data);
			}
		});
	});
});
