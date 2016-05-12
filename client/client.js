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
		if (buffer) {
			buffer = buffer.compose(operation);
		}
		else {
			buffer = operation;
		}
		if (document.getElementById('checkbox').checked) {
			sendUpdates();
		}
		console.log(buffer);
		oldValue = editor.value;
	};

	editor.onkeydown = function(e) {
		if (e.keyCode == 13 && e.metaKey) {
			sendUpdates();
		}
	};

	client = new WebSocket(location.origin.replace(/^http/, 'ws'));
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
			var message = JSON.parse(e.data);
			console.log(message);
			if (message.type === 'init') {
				name = message.assign;
				editor.value = message.text;
				oldValue = editor.value;
			}
			else if (message.type === 'operation') {
				if (message.source == name) {
					if (active) {
						active = false;
						if (document.getElementById('checkbox').checked) {
							sendUpdates();
						}
					}
				}
				else {
					var operation = new Operation(message.ops);
					if (active && buffer) {
						var t1 = active.transform(operation);
						var t2 = buffer.transform(t1[1]);
						applyOperation(t2[1]);
						active = t1[0];
						buffer = t2[0];
					}
					else if (active) {
						var t = active.transform(operation);
						applyOperation(t[1]);
						active = t[0];
					}
					else if (buffer) {
						var t = buffer.transform(operation);
						applyOperation(t[1]);
						buffer = t[0];
					}
					else {
						applyOperation(operation);
					}
				}
			}
			else {
				throw new Error('Unrecognized message type');
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

function sendUpdates() {
	if (buffer && name && !active) {
		active = buffer;
		buffer = null;
		sendOperation(active);
	}
};

function sendOperation(operation) {
	var message = {
		type: 'operation',
		ops: operation.ops,
		source: name
	}
	client.send(JSON.stringify(message));
	console.log(operation);
};

function applyOperation(operation) {
	editor.value = operation.apply(editor.value);
	oldValue = editor.value;
};
