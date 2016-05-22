if (typeof window === 'undefined') {
	WebSocket = require('ws');
	Operation = require('./operation').Operation;
}

var socket = null;
var name = '';
var time = 0;

var active = null;
var buffer = null;

var sendInterval = null;
var intervalTime = 5000;

var onInit = function(text) {
	// Override
};

var onOperation = function(operation) {
	// Override
};

var onSynchronized = function() {
	// Override
};

var onClosed = function() {
	// Override
};

function pushOperation(operation) {
	if (buffer) {
		buffer = buffer.compose(operation);
	}
	else {
		buffer = operation;
	}
	if (socket) {
		sendOperations();
	}
}

function startClient(address) {
	socket = new WebSocket(address);
	socket.onerror = function() {
		console.log('Connection error');
	};

	socket.onopen = function() {
		console.log('Socket opened');
		sendPing();
	};

	socket.onclose = function() {
		console.log('Socket closed');
		socket = null;
		clearTimeout(sendInterval);
		onClosed();
	};

	socket.onmessage = function(e) {
		if (typeof e.data === 'string') {
			var message = JSON.parse(e.data);
			console.log(message);
			time = Math.max(time, message.time + 1);
			if (message.type === 'init') {
				name = message.assign;
				onInit(message.text);
			}
			else if (message.type === 'operation') {
				if (message.source == name) {
					if (active) {
						active = false;
						sendOperations();
					}
				}
				else {
					var operation = new Operation(message.ops);
					if (active && buffer) {
						var t1 = active.transform(operation);
						var t2 = buffer.transform(t1[1]);
						onOperation(t2[1]);
						active = t1[0];
						buffer = t2[0];
					}
					else if (active) {
						var t = active.transform(operation);
						onOperation(t[1]);
						active = t[0];
					}
					else if (buffer) {
						var t = buffer.transform(operation);
						onOperation(t[1]);
						buffer = t[0];
					}
					else {
						onOperation(operation);
					}
				}
			}
			else {
				throw new Error('Unrecognized message type');
			}
		}
	};
}

function sendOperations() {
	if (socket && buffer && name && !active) {
		active = buffer;
		buffer = null;

		var message = {
			type: 'operation',
			ops: active.ops,
			time: time,
			source: name
		}
		socket.send(JSON.stringify(message));
		console.log(message);
		clearTimeout(sendInterval);
		sendInterval = setTimeout(sendPing, intervalTime);
	}
	if (socket && !buffer && !active) {
		onSynchronized();
	}
}

function sendPing() {
	var ping = {
		type: 'ping'
	}
	socket.send(JSON.stringify(ping));
	console.log(ping);
	clearTimeout(sendInterval);
	sendInterval = setTimeout(sendPing, intervalTime);
}

if (typeof window === 'undefined') {
	var address = process.argv[3];
	if (address) {
		startClient(address);
		console.log('!');
		arg = process.argv[2];
		if (arg == 'speedy') {
			onInit = function(text) {
				for (var i = 0; i < 100; i++) {
					var operation = new Operation().retain(text.length).insert(i.toString(16));
					text = operation.apply(text);
					pushOperation(operation);
				}
				process.exit();
			};
		}
		else if (arg == 'realistic') {
			onInit = function(text) {
				var i = 0;
				var f = function() {
					if (i < 100) {
						var operation = new Operation().retain(text.length).insert(i.toString(16));
						text = operation.apply(text);
						pushOperation(operation);
						i += 1;
						setTimeout(f, 100);
					}
					else {
						process.exit();
					}
				}
				f();
			}
		}
		else {
			throw new Error('Incorrect arguments');
		}
	}
	else {
		throw new Error('No socket address given');
	}
}
