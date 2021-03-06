'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _pipe = require('./pipe');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Choreo = {
	create: function create() {
		var shortHand = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

		// state variables
		var sequences = [];
		var isStarted = false;
		var nRepeat = 0;

		//internal
		var inputSequence = [];

		if (!Array.isArray(shortHand)) throw new Error('Choreo initialization is not an array');

		shortHand.forEach(function (seq) {
			if (typeof seq === 'function') {
				_add(seq);
			} else if ((typeof seq === 'undefined' ? 'undefined' : _typeof(seq)) === 'object' && seq.promise) {
				_addPromise(seq.promise);
			} else if ((typeof seq === 'undefined' ? 'undefined' : _typeof(seq)) === 'object' && seq.wait) {
				_wait(seq.wait);
			}
		});

		// Functions _add, _addPromise and _wait will modify states: sequence and inputSequence
		function _add() {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			sequences = addToSequence.apply(undefined, [sequences, function (s) {
				return cancellableTimeout(s, 1);
			}].concat(args));
			inputSequence.push({ type: 'function', data: args });
		}

		function _addPromise() {
			for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				args[_key2] = arguments[_key2];
			}

			console.log('_addPromise: ', args);
			sequences = addToSequence.apply(undefined, [sequences, function (s) {
				return cancellablePromise(s);
			}].concat(args));
			inputSequence.push({ type: 'promise', data: args });
			return this;
		}

		function _wait(delay) {
			if (!(Number(delay) > 0)) throw new Error('time:' + delay + ' must be a number greater than zero.');

			sequences = addToSequence(sequences, function (s) {
				return cancellableTimeout(s, delay);
			}, function (arg) {
				return arg;
			});
			inputSequence.push({ type: 'delay', data: delay });
			return this;
		}

		return Object.create({
			add: function add() {
				_add.apply(undefined, arguments);
				return this;
			},
			addPromise: function addPromise() {
				_addPromise.apply(undefined, arguments);
				return this;
			},

			// Do nothing for sometime. Just return the input arg unaltered (arg) => arg
			wait: function wait(delay) {
				_wait(delay);
				return this;
			},
			popLast: function popLast() {
				sequences.pop();
				return this;
			},
			cancel: function cancel() {
				sequences.forEach(function (sequence) {
					return sequence.cancel();
				});
			},
			start: function start(firstArg) {
				// Append a repeater hook
				this.add(repeater(inputSequence, nRepeat));

				if (!isStarted) {
					// ensure you can only start once
					_pipe.pipeP.apply(undefined, _toConsumableArray(sequences.map(function (s) {
						return s.promise;
					})))(firstArg || '');
					isStarted = true;
				}
				return this;
			},
			loop: function loop(n) {
				// integer or infinity
				if (n <= 0) throw new Error('Repeat value must be > 0. Default value is 1');
				nRepeat = n - 1;
				return this;
			}
		});
	},

	cancellableTimeout: cancellableTimeout,
	cancellablePromise: cancellablePromise
};

function repeater(originalSequence, repetitionsLeft) {
	return function (arg) {
		if (repetitionsLeft-- > 0 || repetitionsLeft === Infinity) {
			_pipe.pipeP.apply(undefined, _toConsumableArray(constructRepeatSequence(originalSequence).map(function (s) {
				return s.promise;
			})))(arg || '');
		}
	};
}

function constructRepeatSequence(inputSequence) {
	return inputSequence.reduce(function (result, snapshot) {
		switch (snapshot.type) {
			case 'delay':
				return addToSequence(result, function (s) {
					return cancellableTimeout(s, snapshot.data);
				}, function (arg) {
					return arg;
				});
			case 'promise':
				return addToSequence.apply(undefined, [result, function (s) {
					return cancellablePromise(s);
				}].concat(_toConsumableArray(snapshot.data)));
			case 'function':
				return addToSequence.apply(undefined, [result, function (s) {
					return cancellableTimeout(s, 1);
				}].concat(_toConsumableArray(snapshot.data)));
		}
	}, []);
}

function addToSequence(currentSequence, seqTransform) {
	for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
		args[_key3 - 2] = arguments[_key3];
	}

	return currentSequence.concat(args.reduce(function (result, item) {
		return Array.isArray(item) ? result.concat(item.map(function (s) {
			return seqTransform(s);
		})) : result.concat(seqTransform(item));
	}, []));
}

// f is a normal function of arity 0. You can send it in curried 
function cancellableTimeout(f, milliseconds) {
	var timerId = 0;

	if (Number(milliseconds) === NaN || milliseconds <= 0) throw new Error('time:' + milliseconds + ' must be a number greater than zero.');
	if (typeof f !== 'function') throw new Error('action is not a function');

	return {
		promise: function promise(arg) {
			return new Promise(function (resolve, reject) {
				timerId = setTimeout(function () {
					timerId = 0;
					resolve(f.call(undefined, arg));
				}, Number(milliseconds));
			});
		},
		cancel: function cancel() {
			if (timerId > 0) {
				clearTimeout(timerId);
			}
		}
	};
}

// Adapted & modified from https://github.com/facebook/react/issues/5465#issuecomment-157888325
// converts a promise returning function to a cancellable promise returning function.
function cancellablePromise(functionThatReturnsAPromise) {
	var isCanceled = false;

	if (typeof functionThatReturnsAPromise !== 'function') throw new Error('action is not a function');

	return {
		promise: function promise(arg) {
			return new Promise(function (resolve, reject) {
				functionThatReturnsAPromise(arg).then(function (val) {
					return isCanceled ? reject({ isCanceled: true }) : resolve(val);
				}).catch(function (error) {
					return isCanceled ? reject({ isCanceled: true }) : reject(error);
				});
			});
		},
		cancel: function cancel() {
			isCanceled = true;
		}
	};
}

exports.default = Choreo;