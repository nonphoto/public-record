var oldValue = "";

window.onload = function() {
	var editor = document.getElementById("editor");
	editor.oninput = function() {
		var newValue = editor.value;
		diff(oldValue, newValue);
		oldValue = newValue;
	};

	client = new WebSocket('ws://localhost:8000/', 'echo-protocol');
	client.onerror = function() {
		console.log('Connection error');
	};
	client.onopen = function() {
		console.log('Client connected');
		client.send('hey');
	};
	client.onclose = function() {
		console.log('Client closed');
	};
	client.onmessage = function(e) {
		if (typeof e.data === 'string') {
			console.log("Received: '" + e.data + "'");
		}
	};
};

function diff(a, b) {
	while(a.charAt(0) == b.charAt(0) && a.length > 0 && b.length > 0) {
		a = a.slice(1);
		b = b.slice(1);
	}
	while(a.slice(-1) == b.slice(-1) && a.length > 0 && b.length > 0) {
		a = a.slice(0, -1);
		b = b.slice(0, -1);
	}
	console.log("deleted: " + a + "\ninserted: " + b);
}
