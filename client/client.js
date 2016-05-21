var Client = function(address) {
	this.address = address;
	this.socket = null;
	this.name = '';
	this.time = 0;

	this.active = null;
	this.buffer = null;

	this.sendInterval = null;
	this.intervalTime = 30000;

	this.oninit = function(text) {
		// Override
	};

	this.onoperation = function(operation) {
		// Override
	};

	this.push = function(operation) {
		if (this.buffer) {
			this.buffer = this.buffer.compose(operation);
		}
		else {
			this.buffer = operation;
		}
		if (this.socket) {
			this.sendOperations();
		}
	};

	this.openSocket = function() {
		var self = this;
		this.socket = new WebSocket(self.address);
		this.socket.onerror = function() {
			console.log('Connection error');
		};

		this.socket.onopen = function() {
			console.log('Socket opened');
			self.sendOperations();
		};

		this.socket.onclose = function() {
			console.log('Socket closed');
			self.socket = null;
			clearInterval(this.sendInterval);
			console.log('Reopening connection');
			window.requestAnimationFrame(self.openSocket);
		};

		this.socket.onmessage = function(e) {
			if (typeof e.data === 'string') {
				var message = JSON.parse(e.data);
				console.log(message);
				self.time = Math.max(self.time, message.time);
				if (message.type === 'init') {
					self.name = message.assign;
					self.oninit(message.text);
				}
				else if (message.type === 'operation') {
					if (message.source == self.name) {
						if (self.active) {
							self.active = false;
							self.sendOperations();
						}
					}
					else {
						var operation = new Operation(message.ops);
						if (self.active && self.buffer) {
							var t1 = self.active.transform(operation);
							var t2 = self.buffer.transform(t1[1]);
							self.onoperation(t2[1]);
							self.active = t1[0];
							self.buffer = t2[0];
						}
						else if (self.active) {
							var t = self.active.transform(operation);
							self.onoperation(t[1]);
							self.active = t[0];
						}
						else if (self.buffer) {
							var t = self.buffer.transform(operation);
							self.onoperation(t[1]);
							self.buffer = t[0];
						}
						else {
							self.onoperation(operation);
						}
					}
				}
				else {
					throw new Error('Unrecognized message type');
				}
			}
		};
	};

	this.sendOperations = function() {
		if (this.socket && this.buffer && this.name && !this.active) {
			this.active = this.buffer;
			this.buffer = null;

			var message = {
				type: 'operation',
				ops: this.active.ops,
				time: this.time,
				source: this.name
			}
			this.socket.send(JSON.stringify(message));
			console.log(message);
			clearInterval(this.sendInterval);
			this.sendInterval = setInterval(this.sendPing, this.intervalTime);
		}
	};

	this.sendPing = function() {
		var ping = {
			type: 'ping'
		}
		this.socket.send(JSON.stringify(ping));
		console.log(ping);
		clearInterval(this.sendInterval);
		this.sendInterval = setInterval(this.sendPing, this.intervalTime);
	};
};

if (typeof module !== 'undefined') {
	module.exports = {
		Client: Client
	}
}
