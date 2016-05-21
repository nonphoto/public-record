var editor = null;
var initText = '';
var oldText = '';

// var address = location.origin.replace(/^http/, 'ws');
var address = 'wss://public-record.herokuapp.com';
client = startClient(address);

onInit = function(text) {
	if (editor) {
		editor.value = text;
		oldText = text;
	}
	else {
		initText = text;
	}
};

onOperation = function(operation) {
	editor.value = operation.apply(editor.value);
}

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
