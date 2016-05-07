var Operation = function() {
	this.ops = [];
	this.sourceLength = 0;
	this.targetLength = 0;

	this.isRetain = function (op) {
		return typeof op === 'number' && op > 0;
	};

	this.isInsert = function (op) {
		return typeof op === 'string';
	};

	this.isDelete = function (op) {
		return typeof op === 'number' && op < 0;
	};

	this.shift = function() {
		return steps.shift();
	}

	this.retain = function(n) {
		if (isRetain(ops[ops.length - 1])) {
			ops[ops.length - 1] += n;
		}
		else {
			ops.push(n);
		}
	}

	this.insert = function(s) {
		if (isInsert(ops[ops.length - 1])) {
			ops[ops.length - 1] += s;
		}
		else {
			ops.push(s);
		}
	}

	this.delete = function(n) {
		if (isDelete(ops[ops.length - 1])) {
			ops[ops.length - 1] -= n;
		}
		else {
			ops.push(-n);
		}
	}

	this.compose = function(that) {
		a = this.ops;
		b = that.ops;
		i = 0;
		j = 0;
		while (true) {
			if (isRetain(a[i]) && isRetain(b[j])) {

				continue;
			}
		}
	}

	this.transform = function(that) {

	}
}
