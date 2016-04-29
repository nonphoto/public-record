var http = require('http');

var server = http.createServer(function(request, response) {
	response.writeHead(200, {'Content-Type': 'text/plain'});
  response.end('Hello\n');
});

server.listen(8000, function() {
    console.log((new Date()) + ' Server is listening on port 8000');
});
