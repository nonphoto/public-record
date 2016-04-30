var express = require('express');
var WebSocketServer = require('websocket').server;

var port = 8000;
var clients = {};

var server = express();
server.use(express.static(__dirname + '/client'));
server.listen(port, function() {
	console.log('Server listening on port ' + port);
});

var client = new WebSocketServer({
	httpServer: server,
	host: '127.0.0.1',
	port: 8000
});

client.on('request', function(r) {
	console.log('Socket connected');
	var connection = r.accept('echo-protocol', r.origin);
	connection.on('message', function(message) {
		console.log(message);
	});
});
