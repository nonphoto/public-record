var op1 = new Operation().retain(3).insert('abc').delete(5).retain(2).insert('ijkl');
var op2 = new Operation().retain(2).delete(3).insert('def').retain(5).insert('gh').retain(2);
s = "0123456789"

var client = null;
var editor = null;
var name = "";
var active = null;
var buffer = null;
var oldValue = "";

window.onload = function() {
	editor = document.getElementById('editor');
	editor.oninput = function() {
		var operation = diff(oldValue, editor.value);
		console.log(operation);
		if (name) {
			if (active) {
				if (buffer) {
					buffer.compose(operation);
				}
				else {
					buffer = operation;
				}
			}
			else {
				active = operation;
				sendOperation(active);
			}
		}
		oldValue = editor.value;
	};

	client = new WebSocket('ws://public-record.herokuapp.com', 'echo-protocol');
	client.onerror = function() {
		console.log('Connection error');
	};

	client.onopen = function() {
		console.log('Client opened');
	};

	client.onclose = function() {
		console.log('Client closed');
	};

	client.onmessage = function(e) {
		if (typeof e.data === 'string') {
			console.log("Received: '" + e.data + "'");
			var message = JSON.parse(e.data);
			if (message.type === 'init') {
				name = message.assign;
				editor.value = message.text;
				oldValue = editor.value;
			}
			else if (message.type === 'operation') {
				if (message.source == name) {
					if (active) {
						if (buffer) {
							active = buffer;
							buffer = null;
							sendOperation(active);
						}
						else {
							active = null;
						}
					}
				}
				else {
					var operation = new Operation(message.ops);
					if (active) {
						if (buffer) {
							var t1 = active.transform(operation);
							var t2 = buffer.transform(t1[1]);
							applyOperation(t2[1]);
							active = t1[0];
							buffer = t2[0];
						}
						else {
							var t = active.transform(operation);
							applyOperation(t[1]);
							active = t[0];
						}
					}
					else {
						applyOperation(operation);
					}
				}
			}
			else {
				console.log('Unrecognized message type');
			}
		}
	};
};

function diff(a, b) {
	i = 0;
	while (a.charAt(0) == b.charAt(0) && a.length > 0 && b.length > 0) {
		a = a.slice(1);
		b = b.slice(1);
		i++;
	}

	j = 0;
	while (a.slice(-1) == b.slice(-1) && a.length > 0 && b.length > 0) {
		a = a.slice(0, -1);
		b = b.slice(0, -1);
		j++;
	}

	return new Operation().retain(i).delete(a.length).insert(b).retain(j);
};

function sendOperation(operation) {
	var message = {
		type: 'operation',
		ops: operation.ops,
		source: name
	}
	client.send(JSON.stringify(message));
}

function applyOperation(operation) {
	editor.value = operation.apply(editor.value);
	oldValue = editor.value;
}
