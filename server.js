var express = require('express');
var http = require("http");
var WebSocketServer = require('ws').Server;

var port = 8000;
var clients = {};
var nextName = 0;

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
		for (var i = 0; i < clients.length; i++) {
			clients[i].send(data);
		}
	});

	client.name = nextName.toString(16);
	console.log('Client ' + client.name + ' connected');
	nextName++;

	client.send(JSON.stringify({
		assign: client.name
	}));

	clients[client.name] = client;
});
