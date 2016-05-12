var Operation = function(other) {
	this.ops = [];
	this.sourceLength = 0;
	this.targetLength = 0;

	isRetain = function (op) {
		return typeof op === 'number' && op > 0;
	};

	isInsert = function (op) {
		return typeof op === 'string';
	};

	isDelete = function (op) {
		return typeof op === 'number' && op < 0;
	};

	this.retain = function (n) {
		if (typeof n !== 'number') {
			throw new Error('Expected number');
		}
		if (n === 0) {
			return this;
		}
		this.sourceLength += n;
		this.targetLength += n;
		if (isRetain(this.ops[this.ops.length - 1])) {
			this.ops[this.ops.length - 1] += n;
		} else {
			this.ops.push(n);
		}
		return this;
	};

	this.insert = function (s) {
		if (typeof s !== 'string') {
			throw new Error('Expected string');
		}
		if (s === '') {
			return this;
		}
		this.targetLength += s.length;
		if (isInsert(this.ops[this.ops.length - 1])) {
			this.ops[this.ops.length - 1] += s;
		}
		else if (isDelete(this.ops[this.ops.length - 1])) {
			if (isInsert(this.ops[this.ops.length - 2])) {
				this.ops[this.ops.length - 2] += s;
			} else {
				this.ops[this.ops.length] = this.ops[this.ops.length - 1];
				this.ops[this.ops.length - 2] = s;
			}
		} else {
			this.ops.push(s);
		}
		return this;
	};

	this.delete = function (n) {
		if (typeof n !== 'number') {
			throw new Error('Expected number');
		}
		if (n === 0) {
			return this;
		}
		if (n > 0) {
			n = -n;
		}
		this.sourceLength -= n;
		if (isDelete(this.ops[this.ops.length - 1])) {
			this.ops[this.ops.length - 1] += n;
		} else {
			this.ops.push(n);
		}
		return this;
	};

	this.apply = function(s) {
		if (s.length !== this.sourceLength) {
			throw new Error(
				"Cannot apply operation with source length " +
				this.sourceLength +
				" to string of length " +
				s.length
			);
		}
		var result = '';
		var j = 0;
		for (var i = 0, l = this.ops.length; i < l; i++) {
			var op = this.ops[i];
			if (isRetain(op)) {
				result += s.slice(j, j + op);
				j += op;
			}
			else if (isInsert(op)) {
				result += op;
			}
			else {
				j -= op;
			}
		}
		if (j !== s.length) {
			throw new Error("The operation didn't operate on the whole string.");
		}
		return result
	}

	this.compose = function(that) {
		if (this.targetLength !== that.sourceLength) {
			throw new Error("Cannot compose operations with mismatched lengths");
		}
		var result = new Operation();
		var i = 0, j = 0;
		var a = this.ops[i++];
		var b = that.ops[j++];
		while (typeof a !== 'undefined' || typeof b !== 'undefined') {
			if (isDelete(a)) {
				result.delete(a);
				a = this.ops[i++];
			}
			else if (isInsert(b)) {
				result.insert(b);
				b = that.ops[j++];
			}
			else if (isRetain(a) && isRetain(b)) {
				if (a > b) {
					result.retain(b);
					a = a - b;
					b = that.ops[j++];
				} else if (a === b) {
					result.retain(a);
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					result.retain(a);
					b = b - a;
					a = this.ops[i++];
				}
			}
			else if (isInsert(a) && isDelete(b)) {
				if (a.length > -b) {
					a = a.slice(-b);
					b = that.ops[j++];
				} else if (a.length === -b) {
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					b = b + a.length;
					a = this.ops[i++];
				}
			}
			else if (isInsert(a) && isRetain(b)) {
				if (a.length > b) {
					result.insert(a.slice(0, b));
					a = a.slice(b);
					b = that.ops[j++];
				} else if (a.length === b) {
					result.insert(a);
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					result.insert(a);
					b = b - a.length;
					a = this.ops[i++];
				}
			}
			else if (isRetain(a) && isDelete(b)) {
				if (a > -b) {
					result.delete(b);
					a = a + b;
					b = that.ops[j++];
				} else if (a === -b) {
					result.delete(b);
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					result.delete(a);
					b = b + a;
					a = this.ops[i++];
				}
			}
			else {
				throw new Error(
					"Cannot compose operations.\na: " +
					JSON.stringify(a) + "\nb: " +
					JSON.stringify(b)
				);
			}
		}
		return result;
	};

	this.transform = function(that) {
		if (this.sourceLength !== that.sourceLength) {
			throw new Error("Both operations have to have the same base length");
		}
		var thisprime = new TextOperation();
		var thatprime = new TextOperation();
		var i = 0;
		var j = 0;
		var a = this.ops[i++];
		var b = that.ops[j++];
		var minl;
		while (typeof a !== 'undefined' || typeof b !== 'undefined') {
			if (isInsert(a)) {
				thisprime.insert(a);
				thatprime.retain(a.length);
				a = this.ops[i++];
			}
			else if (isInsert(b)) {
				thisprime.retain(b.length);
				thatprime.insert(b);
				b = that.ops[j++];
			}
			else if (isRetain(a) && isRetain(b)) {
				if (a > b) {
					minl = b;
					a = a - b;
					b = that.ops[j++];
				} else if (a === b) {
					minl = b;
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					minl = a;
					b = b - a;
					a = this.ops[i++];
				}
				thisprime.retain(minl);
				thatprime.retain(minl);
			}
			else if (isDelete(a) && isDelete(b)) {
				if (-a > -b) {
					a = a - b;
					b = that.ops[j++];
				} else if (a === b) {
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					b = b - a;
					a = this.ops[i++];
				}
			}
			else if (isDelete(a) && isRetain(b)) {
				if (-a > b) {
					minl = b;
					a = a + b;
					b = that.ops[j++];
				} else if (-a === b) {
					minl = b;
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					minl = -a;
					b = b + a;
					a = this.ops[i++];
				}
				thisprime.delete(minl);
			}
			else if (isRetain(a) && isDelete(b)) {
				if (a > -b) {
					minl = -b;
					a = a + b;
					b = that.ops[j++];
				} else if (a === -b) {
					minl = a;
					a = this.ops[i++];
					b = that.ops[j++];
				} else {
					minl = a;
					b = b + a;
					a = this.ops[i++];
				}
				thatprime.delete(minl);
			}
			else {
				throw new Error(
					"Cannot transform operations.\na: " +
					JSON.stringify(a) + "\nb: " +
					JSON.stringify(b)
				);
			}
		}
		return [thisprime, thatprime];
	};

	if (other) {
		for (var i = 0, l = other.length; i < l; i++) {
			var op = other[i];
			if (isRetain(op)) {
				this.retain(op);
			} else if (isInsert(op)) {
				this.insert(op);
			} else if (isDelete(op)) {
				this.delete(op);
			} else {
				throw new Error("Unknown operation: " + JSON.stringify(op));
			}
		}
	}
}

if (typeof module !== 'undefined') {
	module.exports = {
		Operation: Operation
	}
}
