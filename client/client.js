var op1 = new Operation().retain(3).insert('abc').delete(5).retain(2).insert('ijkl');
var op2 = new Operation().retain(2).delete(3).insert('def').retain(5).insert('gh').retain(2);
s = "0123456789"

var client = null;
var editor = null;
var name = -1;
var oldValue = "";

window.onload = function() {
	editor = document.getElementById('editor');
	var checkEditor = function() {
		diff(oldValue, editor.value);
		oldValue = editor.value;
	};

	editor.onkeyup = checkEditor;
	editor.onmouseup = checkEditor;
	editor.ondragend = checkEditor;

	client = new WebSocket('ws://localhost:8000/', 'echo-protocol');
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
			if (message.hasOwnProperty('assign')) {
				name = message.assign;
			}
			else if (message.name != name) {
				var s = editor.value;
				s = s.slice(0, message.position) + message.insert + s.slice(message.position + message.delete);
				editor.value = s;
			}
		}
	};
};

function diff(a, b) {
	i = 0;
	while(a.charAt(0) == b.charAt(0) && a.length > 0 && b.length > 0) {
		a = a.slice(1);
		b = b.slice(1);
		i++;
	}

	j = 0;
	while(a.slice(-1) == b.slice(-1) && a.length > 0 && b.length > 0) {
		a = a.slice(0, -1);
		b = b.slice(0, -1);
		j++;
	}

	result = {
		name: name,
		position: i,
		delete: a.length,
		insert: b
	}
	console.log(result);

	if (name >= 0) {
		client.send(JSON.stringify(result));
	}
}
