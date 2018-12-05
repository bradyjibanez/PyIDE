/*
 * Implements ws4redis and diff_match_patch to faciliate code communication
 *
 */
$(document).ready(function() {

	// Set Constants
	var INIT	= 0;
	var PUSH	= 1;
	var PULL	= 2;
	var PULSE	= 3
	var ASSERT  = 4;
	var SYNC	= 5;
	var ELECT	= 6;
	var VOTE	= 7;

	var FC_THRESHOLD = 4; // Find co-ordinator threshold
	var PS_THRESHOLD = 4; // Push threshold

	var HB_INTERVAL = 500;

	// Get file path and other info from elements
	var processId = $("#processIdTag").data("id");
	// Standing in for IP and Port, if set, for submission purposes
	var ip = $("#projectNameTag").data("name");
	var port = $("#fileNameTag").data("name");
	var csrf = $("#tokenTag").data("token");

	if( project != "" ) {
		var ws = new WebSocket('ws://' + ip + ':' + port + '/ws/scalinkd?subscribe-broadcast&publish-broadcast&echo')
	} else {
		var ws = new WebSocket('ws://localhost:8000/ws/scalinkd?subscribe-broadcast&publish-broadcast&echo');
	}

	// Set heartbeat JSON
	var heartbeat_interval = null;
	var heartbeat_data = {};
	heartbeat_data["id"] = processId;
	heartbeat_data["message_id"] = PULSE;
	heartbeat_data["message"] = "--beat--";
	var heartbeat_message = JSON.stringify(heartbeat_data);
	// Initialize heartbeat values
	var missed_heartbeats = 0;
	var caught_heartbeats = 0;
	// Initialize code base array
	var last_code = "";
	// Initialize co-ordinator variables and set to false
	var is_announced = false;
	var is_coordinator = false;
	var found_coordinator = false;
	var election_called = false;
	var is_syncd = false;
	var awaiting_response = false;
	var is_victor = false;

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
		var msg = json["message"];

		console.log("Received: " + pId + "-" + mId);
		// Track heartbeats
		if( mId == PULSE && pId == processId ) {
			missed_heartbeats = 0;
			caught_heartbeats++;
		}
		if( !is_announced ) {
			consoleOutput("Announcing connection.\n")
			initializeCommunication();
			is_announced = true;
		}
		if ( found_coordinator && !is_sycnd ) {
			consoleOutput("Attempting to Sync");
			var response = {}

			response["id"] = processId;
			response["message_id"] = PULL;
			reponse["message"] = "Send code."

			var response_json = JSON.stringify(response);
			ws.send(response_json);
		}
		// Determine co-ordinator if not found
		else if( !found_coordinator ) {
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
						coordinatorHandleInit();
					} else if( mId == PULL ) {
						coordinatorHandlePush();
					} else if( mId == PUSH ) {
						coordinatorHandlePull();
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
					console.log(msg);
					if( mId == PULSE && pId == processId ) {
						// Clear missed heartbeats
						missed_heartbeats = 0;
						// Increment caught heartbeats
						caught_heartbeats++;
						if( caught_heartbeats >= PS_THRESHOLD*2 && awaiting_response) {
							awaiting_response = false;
							// Create response array
							var response = {};
							// Set response values
							response["id"] = processId;
							response["message_id"] = ELECT;
							response["message"] = "Elect a new co-ordinator!";
							// Send response
							var json_response = JSON.stringify(response);
							ws.send(json_response);
							election_called = true;
						} else if( caught_heartbeats >= PS_THRESHOLD*2 && election_called ) {
							if( is_victor ) {
								var response = {};
								response["id"] = processId;
								response["message_id"] = ASSERT;
								response["message"] = "I am the coordinator";
								var json_response = JSON.stringify(response);
								ws.send(json_response);

								/*
								 *
								 * Couldn't get the function to work correctly if declared and called
								 * This is surplus code that would be refactored out given more time
								 * PLease ignore.
								 */
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
										coordinatorHandleInit();
									} else if( mId == PULL ) {
										coordinatorHandlePull();
									} else if( mId == PUSH ) {
										coordinatorHandlePush(msg);
									}
								}
								/* End of Surplus */
							}
						} else if( caught_heartbeats >= PS_THRESHOLD ) {
							contributorHandlePush();
						} 
					} 
					if ( !is_syncd ) {
						contributorHandleInitSync()
					} else if ( mId == SYNC ) {
						contributorHandleSync();
					} else if ( mId == ELECT ) {
						contributorHandleElect();
					} else if ( mId == VOTE ) {
						if( processId < pId ) {
							is_victor = false;
						}
					} else if ( mId == ASSERT ) {
						is_victor = false;
						election_called = false;
					}
				}
			}
		}
	}
		
	/*
	 * Handles co-ordinator response to INIT process
	 */
	function coordinatorHandleInit() {
		// Create response array
		var response = {};
		// Set response values
		response["id"] = processId;
		response["message_id"] = ASSERT;
		response["message"] = "I am the co-ordinator";
		// Create JSON string from response
		var json_response = JSON.stringify(response);
		ws.send(json_response);
	}

	/*
	 * Handles co-ordinator actions during a PULL
	 */
	function coordinatorHandlePull() {
		// Get current base
		var code = code_codemirror.getValue();
		console.log(code);
		// Create response array
		var response = {};
		// Set response values
		response["id"] = processId;
		response["message_id"] = SYNC;
		response["target"] = pId;
		response["message"] = code;
		// Create JSON string from respons
		var json_response = JSON.stringify(response);
		ws.send(json_response)
	}
	
	/*
	 * Handles co-ordinator actions during a PUSH
	 */
	function coordinatorHandlePush(msg) {
		// Library looks for periods at end of lines to create sentences
		var current = code_codemirror.getValue();
		var sent_code = msg;
		// Merge code together
		var result = handleMerge(current, sent_code);
		// Set own code
		var cursor = code_codemirror.getCursor();
		code_codemirror.setValue(result);
		code_codemirror.setCursor(cursor);
		// Create response array
		var response = {};
		// Set response values
		response["id"] = processId;
		response["message_id"] = SYNC;
		response["target"] = pId; // Produces undesirable results when in use, kept for posteriy
		response["message"] = result;
		// Create JSON string from response
		var json_response = JSON.stringify(response);
		ws.send(json_response);
	}
	
	/*
	 * Pushes code to the co-ordinator
	 */
	function contributorHandlePush() {
		caught_heartbeats = 0;
		console.log("Pushing");
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
		awaiting_response = true;
		return;
	}
	
	/*
	 * Handles request to sync upon initialization
	 */
	function contributorHandleInitSync() {
		consoleOutput("Attempting to Sync");
		var response = {}

		response["id"] = processId;
		response["message_id"] = PULL;
		response["message"] = "Send code."

		var response_json = JSON.stringify(response);
		ws.send(response_json);
		is_syncd = true;
	}
	
	/*
	 * Handles Sync commands sent by Co-ordinator
	 */
	function contributorHandleSync() {
		awaiting_response = false;
		// Log request to console
		var log = "Sync request received. Updating code base.\n";
		consoleOutput(log);
		var cursor = code_codemirror.getCursor();
		// Set new code to active code
		code_codemirror.setValue(msg);
		code_codemirror.setCursor(cursor)
		return;
	}
	
	/*
	 * Handles communicating Process ID during election
	 */
	function contributorHandleElect() {
		// Assume victory
		is_victor = true;
		election_called = true;
		var response = {};
		response["id"] = processId;
		response["message_id"] = VOTE;
		response["message"] = "Pick me!";
		var json_response = JSON.stringify(response);
		ws.send(json_response);

	}

	/*
	 * Merges code files using Google's diff_match_patch library
	 */
	function handleMerge(code1, code2) {
		// Initial diff_match_patch
		var dmp = new diff_match_patch();
		dmp.Match_Threshold = 0.1;
		dmp.Delete_Threshold = 0.1;
		var diff = dmp.diff_main(code1, code2);
		// Create patch to resolve differences
		var patch = dmp.patch_make(code1, code2, diff);
		// Apply patches
		var result = dmp.patch_apply(patch, code1)
		console.log(result[0]);
		return result[0];
	}

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
