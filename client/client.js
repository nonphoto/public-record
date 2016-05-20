var client = null;
var editor = null;
var auto = true;
var name = "";
var time = 0;
var active = null;
var buffer = null;
var oldValue = "";
var sendInterval = null;
var intervalTime = 10000;

window.onload = function() {
	var toggle = document.getElementById('toggle');
	toggle.onclick = function() {
		auto = !auto;
		this.classList.toggle('selected');
	}

	editor = document.getElementById('editor');
	editor.oninput = function() {
		var operation = diff(oldValue, editor.value);
		if (buffer) {
			buffer = buffer.compose(operation);
		}
		else {
			buffer = operation;
		}
		if (auto) {
			sendUpdates();
		}
		console.log(buffer);
		oldValue = editor.value;
	};

	editor.onkeydown = function(e) {
		if (e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
			sendUpdates();
		}
	};
	openSocket();
};

function openSocket() {
	// var address = location.origin.replace(/^http/, 'ws');
	client = new WebSocket('wss://public-record.herokuapp.com');
	client.onerror = function() {
		console.log('Connection error');
	};

	client.onopen = function() {
		console.log('Client opened');
		sendPing();
		spinBlue();
	};

	client.onclose = function() {
		console.log('Client closed');
		spinRed();
		window.requestAnimationFrame(openSocket);
	};

	client.onmessage = function(e) {
		if (typeof e.data === 'string') {
			var message = JSON.parse(e.data);
			console.log(message);
			time = Math.max(time, message.time);
			if (message.type === 'init') {
				name = message.assign;
				editor.value = message.text;
				oldValue = editor.value;
			}
			else if (message.type === 'operation') {
				if (message.source == name) {
					if (active) {
						spinStop();
						active = false;
						if (auto) {
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
}

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
		spinStart();
	}
};

function sendOperation(operation) {
	var message = {
		type: 'operation',
		ops: operation.ops,
		time: time,
		source: name
	}
	client.send(JSON.stringify(message));
	console.log(operation);
	clearInterval(sendInterval);
	sendInterval = setInterval(sendPing, intervalTime);
};

function sendPing() {
	var ping = {
		type: 'ping'
	}
	client.send(JSON.stringify(ping));
	console.log(ping);
	clearInterval(sendInterval);
	sendInterval = setInterval(sendPing, intervalTime);
}

function applyOperation(operation) {
	editor.value = operation.apply(editor.value);
	oldValue = editor.value;
};

function spinStart() {
	document.getElementById('spinner').style.animationName = 'spin';
}

function spinStop() {
	document.getElementById('spinner').style.animationName = 'none';
}

function spinBlue() {
	document.getElementById('spinner').style.stroke = '#419bf9';
	document.getElementById('toggle').style.borderColor = '#419bf9';
}

function spinRed() {
	document.getElementById('spinner').style.stroke = 'red';
	document.getElementById('toggle').style.borderColor = 'red';
}
