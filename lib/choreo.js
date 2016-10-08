'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ramda = require('ramda');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Choreo = {
	create: function create() {
		var sequences = [];
		var isStarted = false;
		return Object.create({
			// Sequence is a normal function or an array of normal functions.
			add: function add(sequence) {
				if (Array.isArray(sequence)) {
					sequence.forEach(function (s) {
						sequences.push(cancellableTimeout(s, 1));
					});
				} else {
					sequences.push(cancellableTimeout(sequence, 1));
				}
			},

			// For async functions that need to be waited upon.
			addPromise: function addPromise(functionThatReturnsAPromise) {
				sequences.push(cancellablePromise(functionThatReturnsAPromise));
			},

			// Do nothing for sometime.
			wait: function wait(delay) {
				if (delay <= 0) {
					throw new Error('wait time must be greater than zero.');
				}
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
			start: function start() {
				if (!isStarted && sequences.length > 0) {
					_ramda.pipeP.apply(undefined, _toConsumableArray(sequences.map(function (s) {
						return s.promise;
					})))('');
					isStarted = true;
				}
			}
		});
	},

	cancellableTimeout: cancellableTimeout,
	cancellablePromise: cancellablePromise
};

// f is a normal function of arity 0. You can send it in curried 
function cancellableTimeout(f, milliseconds) {
	var timerId = 0;

	if (typeof f !== 'function') {
		throw new Error('action is not a function');
	}

	return {
		promise: function promise(arg) {
			return new Promise(function (resolve, reject) {
				timerId = setTimeout(function () {
					timerId = 0;
					resolve(f(arg));
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

	if (typeof functionThatReturnsAPromise !== 'function') {
		throw new Error('action is not a function');
	}

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