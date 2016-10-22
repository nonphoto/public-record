var editor = null;
var initText = '';
var oldText = '';
var attempts = 0;

// var address = 'wss://public-record.herokuapp.com'
var address = window.location.href.replace(/^http/, 'ws');
console.log(address);
startClient(address);

onInit = function(text) {
	if (editor) {
		editor.value = text;
		oldText = text;
	}
	else {
		initText = text;
	}
	attempts = 0;
};

onOperation = function(operation) {
	var selection = operation.applyToSelection(editor.selectionStart, editor.selectionEnd);
	editor.value = operation.apply(editor.value);
	console.log(selection);
	oldText = editor.value;
	editor.setSelectionRange(selection[0], selection[1]);
};

onClosed = function() {
	window.requestAnimationFrame(function() {
		if (attempts < 3) {
			attempts += 1;
			startClient(address);
		}
	});
};

getText = function() {
	return editor.value;
};

window.onload = function() {
	editor = document.getElementById('editor');
	editor.value = initText;
	oldText = initText;
	editor.oninput = function() {
		var operation = diff(oldText, editor.value);
		pushOperation(operation);
		oldText = editor.value;
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
