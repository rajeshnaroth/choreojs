'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
//re-engineering a lite pipeP version
/*


return p1().then(p2).then(p3).then(p4)
or
return p1.call(null, firstArg).then(pResult => {
	return p2.call(null, pResult).then(pResult => {
		return p3.call(null, pResult).then(pResult => {
			return p4.call(null, pResult)
		}
	})
})

*/

var pipeP = exports.pipeP = function pipeP() {
	for (var _len = arguments.length, promises = Array(_len), _key = 0; _key < _len; _key++) {
		promises[_key] = arguments[_key];
	}

	if (promises.length < 1) {
		throw new Error('you must provide at least one promise to pipe');
	}
	var firstOne = promises[0];
	var theRest = promises.slice(1, Infinity);

	return theRest.reduce(_pipe, firstOne);
};

// reducer
function _pipe(firstOne, secondOne) {
	var _this = this;

	// return firstOne.then(secondOne)
	return function () {
		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		return firstOne.call.apply(firstOne, [_this].concat(args)).then(function (retList) {
			return secondOne.call(_this, retList);
		});
	};
}