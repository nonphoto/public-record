var express = require('express');
var http = require('http');
var pg = require('pg');
var WebSocketServer = require('ws').Server;
var Operation = require('./client/operation').Operation;

var port = process.env.PORT || 8000
var clients = {};
var operations = [];
var nextName = 0;
var text = '';

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
	if (err) throw err;
	console.log('Querying database');
	client.query('SELECT * FROM DOCUMENT;').on('row', function(row) {
		console.log('DOCUMENT: ' + JSON.stringify(row));
		text = row.value;
	});
});

process.on('SIGTERM', function() {
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		if (err) throw err;
		console.log('Updating database');
		var databaseText = '';
		client.query('UPDATE DOCUMENT SET VALUE = \'' + text + '\';').on('end', function(result) {
			process.exit();
		});
	});
});

var app = express();
app.use(express.static(__dirname + '/client'));

var server = http.createServer(app)
server.listen(port, function() {
	console.log('Server listening on port ' + port);
});

var socket = new WebSocketServer({server: server});
socket.on('connection', function(client) {

	client.on('close', function() {
		console.log('Client ' + this.name + ' disconnected');
		delete clients[this.name];
	});

	client.on('message', function(data, flags) {
		console.log(data);
		var message = JSON.parse(data);
		if (message.type === 'operation') {
			var operation = new Operation(message.ops);
			if (message.time < operations.length) {
				var concurrentOperations = operations.slice(message.time - operations.length);
				for (var i = 0; i < concurrentOperations.length; i++) {
					operation = operation.transform(concurrentOperations[i])[0];
					message.ops = operation.ops;
				}
			}
			operations.push(operation);
			message.time = operations.length;
			for (var k in clients) {
				clients[k].send(JSON.stringify(message));
			}
			text = operation.apply(text);
		}
	});

	client.name = nextName.toString(16);
	console.log('Client ' + client.name + ' connected');
	nextName++;

	client.send(JSON.stringify({
		type: 'init',
		assign: client.name,
		time: operations.length,
		text: text
	}));

	clients[client.name] = client;
});
