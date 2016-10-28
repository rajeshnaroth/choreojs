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

export const pipeP = function(...promises) {
	if (promises.length < 1) {
		throw new Error('you must provide at least one promise to pipe')
	}
	let firstOne = promises[0]
	let theRest = promises.slice(1, Infinity)

	return theRest.reduce(_pipe, firstOne)
}

// reducer
function _pipe(firstOne, secondOne) {
	// return firstOne.then(secondOne)
	return (...args) => firstOne.call(this, ...args).then((retList) => secondOne.call(this, retList))
}