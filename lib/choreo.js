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
			// For async functions that need to be waited upon.
			addPromise: function addPromise(promise) {
				sequences.push(cancellablePromise(promise));
			},

			// Sequence is a normal function.
			add: function add(sequence) {
				sequences.push(cancellableTimeout(sequence, 1));
			},

			// Do nothing for sometime.
			wait: function wait(delay) {
				sequences.push(cancellableTimeout(function (arg) {
					return arg;
				}, delay));
			},
			popLast: function popLast() {
				sequences.pop();
			},
			cancel: function cancel() {
				sequences.map(function (sequence) {
					return sequence.cancel();
				});
			},
			start: function start() {
				if (!isStarted && sequences.length > 0) {
					_ramda.pipeP.apply(undefined, _toConsumableArray(sequences.map(function (s) {
						return s.promise;
					})))();
					isStarted = true;
				}
			}
		});
		// f is a normal function of arity 0. You can send it in curried 
		function cancellableTimeout(f, milliseconds) {
			var timerId = 0;
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
		//
		function cancellablePromise(promiseReturningFunction) {
			var isCanceled = false;

			return {
				promise: function promise(arg) {
					return new Promise(function (resolve, reject) {
						promiseReturningFunction().then(function () {
							return isCanceled ? reject({ isCanceled: true }) : resolve(arg);
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
	}
};

exports.default = Choreo;