'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _pipe = require('./pipe');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Choreo = {
	create: function create() {
		// state variables
		var sequences = [];
		var isStarted = false;

		//internal
		var inputSequence = [];

		return Object.create({
			add: function add() {
				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				sequences = addToSequence.apply(undefined, [sequences, function (s) {
					return cancellableTimeout(s, 1);
				}].concat(args));
				inputSequence.push({ isPromise: false, sequence: args });
			},
			addPromise: function addPromise() {
				for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
					args[_key2] = arguments[_key2];
				}

				sequences = addToSequence.apply(undefined, [sequences, function (s) {
					return cancellablePromise(s);
				}].concat(args));
				inputSequence.push({ isPromise: true, sequence: args });
			},

			// Do nothing for sometime.
			wait: function wait(delay) {
				if (delay <= 0) throw new Error('wait time must be greater than zero.');

				sequences.push(cancellableTimeout(function (arg) {
					return arg;
				}, delay));
			},
			popLast: function popLast() {
				sequences.pop();
			},
			cancel: function cancel() {
				sequences.forEach(function (sequence) {
					return sequence.cancel();
				});
			},
			start: function start(arg) {
				if (!isStarted && sequences.length > 0) {
					_pipe.pipeP.apply(undefined, _toConsumableArray(sequences.map(function (s) {
						return s.promise;
					})))(arg || '');
					isStarted = true;
				}
			}
		});
	},

	cancellableTimeout: cancellableTimeout,
	cancellablePromise: cancellablePromise
};

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

	if (typeof f !== 'function') throw new Error('action is not a function');

	return {
		promise: function promise(arg) {
			return new Promise(function (resolve, reject) {
				timerId = setTimeout(function () {
					timerId = 0;
					resolve(f.call(undefined, arg));
				}, milliseconds);
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