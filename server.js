var express = require('express');
var http = require("http");
var WebSocketServer = require('ws').Server;

var port = 8000;
var clients = [];

var app = express();
app.use(express.static(__dirname + '/client'));

var server = http.createServer(app)
server.listen(port, function() {
	console.log('Server listening on port ' + port);
});

var socket = new WebSocketServer({server: server});
socket.on('connection', function(client) {
	console.log('Client connected');

	client.send(JSON.stringify({
		assign: clients.length
	}));

	client.on('close', function() {
		console.log('Client disconnected');
		// Remove client from client list
	});

	client.on('message', function(data, flags) {
		console.log(data);
		for (var i = 0; i < clients.length; i++) {
			clients[i].send(data);
		}
	});

	clients.push(client);
});
