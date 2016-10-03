(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(['exports', 'ramda'], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports, require('ramda'));
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, global.ramda);
		global.choreo = mod.exports;
	}
})(this, function (exports) {
	(function (global, factory) {
		if (typeof define === "function" && define.amd) {
			define(['exports', 'ramda'], factory);
		} else if (typeof exports !== "undefined") {
			factory(exports);
		} else {
			var mod = {
				exports: {}
			};
			factory(mod.exports, global.ramda);
			global.choreo = mod.exports;
		}
	})(this, function (exports, _ramda) {
		'use strict';

		Object.defineProperty(exports, "__esModule", {
			value: true
		});
		exports.cancellablePromise = exports.cancellableTimeout = undefined;

		function _toConsumableArray(arr) {
			if (Array.isArray(arr)) {
				for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
					arr2[i] = arr[i];
				}

				return arr2;
			} else {
				return Array.from(arr);
			}
		}

		var Choreo = {
			create: function create() {
				var sequences = [];
				var isStarted = false;
				return Object.create({
					addPromise: function addPromise(promise) {
						sequences.push(cancellablePromise(promise));
					},
					add: function add(sequence) {
						sequences.push(cancellableTimeout(sequence, 1));
					},
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
			}
		};

		// f is a normal function of arity 0. You can send it in curried 
		var cancellableTimeout = exports.cancellableTimeout = function cancellableTimeout(f, milliseconds) {
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
		};

		var cancellablePromise = exports.cancellablePromise = function cancellablePromise(promiseReturningFunction) {
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
		};

		exports.default = Choreo;
	});
});