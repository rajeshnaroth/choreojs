import { pipeP } from './pipe'

const Choreo = {
	create(shortHand=[]) {
		// state variables
		let sequences = []
		let isStarted = false
		let nRepeat = 0

		//internal
		let inputSequence = []

		if (!Array.isArray(shortHand)) throw new Error('Choreo initialization is not an array')

		shortHand.forEach((seq) => {
			if (typeof seq === 'function') {
				_add(seq)
			} else if (typeof seq === 'object' && seq.promise) {
				_addPromise(seq.promise)
			} else if (typeof seq === 'object' && seq.wait) {
				_wait(seq.wait)
			}
		})

		// Functions _add, _addPromise and _wait will modify states: sequence and inputSequence
		function _add(...args) {
			sequences = addToSequence(sequences, (s) => cancellableTimeout(s, 1), ...args)
			inputSequence.push({type:'function', data:args})
		}

		function _addPromise(...args) {
			console.log('_addPromise: ', args)
			sequences = addToSequence(sequences, (s) => cancellablePromise(s), ...args)
			inputSequence.push({type:'promise', data:args})
			return this
		}

		function _wait(delay) {
			if (!(Number(delay) > 0)) throw new Error('time:' + delay + ' must be a number greater than zero.')

			sequences = addToSequence(sequences, (s) => cancellableTimeout(s, delay), (arg) => arg)
			inputSequence.push({type:'delay', data:delay})
			return this
		}

		return Object.create({
			add(...args) {
				_add(...args)
				return this
			},
			addPromise(...args) {
				_addPromise(...args)
				return this
			},
			// Do nothing for sometime. Just return the input arg unaltered (arg) => arg
			wait(delay) {
				_wait(delay)
				return this
			},
			popLast() {
				sequences.pop()
				return this
			},
			cancel() {
				sequences.forEach(sequence => sequence.cancel())
			},
			start(firstArg) {
				// Append a repeater hook
				this.add(repeater(inputSequence, nRepeat))

				if (!isStarted) { // ensure you can only start once
					pipeP(...(sequences.map(s => s.promise)))(firstArg || '')
					isStarted = true
				}
				return this
			},
			loop(n) { // integer or infinity
				if (n <= 0) throw new Error('Repeat value must be > 0. Default value is 1')
				nRepeat = n - 1
				return this
			}

		})
	},
	cancellableTimeout,
	cancellablePromise
}

function repeater(originalSequence, repetitionsLeft) {
	return (arg) => {
		if (repetitionsLeft-- > 0 || repetitionsLeft === Infinity) {
			pipeP(...(constructRepeatSequence(originalSequence).map(s => s.promise)))(arg || '')
		}
	}
}

function constructRepeatSequence(inputSequence) {
	return inputSequence.reduce((result, snapshot) => {
		switch (snapshot.type) {
			case 'delay':
				return addToSequence(result, (s) => cancellableTimeout(s, snapshot.data), (arg) => arg)
			case 'promise':
				return addToSequence(result, (s) => cancellablePromise(s), ...snapshot.data)
			case 'function':
				return addToSequence(result, (s) => cancellableTimeout(s, 1), ...snapshot.data)
		}
	}, [])

}

function addToSequence(currentSequence, seqTransform, ...args) {
	return currentSequence.concat(
		args.reduce(
		(result, item) => Array.isArray(item) ?
							result.concat(item.map(s => seqTransform(s))) 
							: result.concat(seqTransform(item)), 
		[])
	)
}

// f is a normal function of arity 0. You can send it in curried 
function cancellableTimeout(f, milliseconds) { 
	let timerId = 0
	
	if (Number(milliseconds) === NaN || milliseconds <= 0) throw new Error('time:' + milliseconds + ' must be a number greater than zero.')
	if (typeof f !== 'function') throw new Error('action is not a function')

	return {
		promise: (arg) => new Promise((resolve, reject) =>  {
			timerId = setTimeout(() => {
					timerId = 0 					        
					resolve(f.call(undefined, arg))
				}, Number(milliseconds))
		}),
		cancel: () => {
			if (timerId > 0) {
				clearTimeout(timerId)
			}
		}
	}
}

// Adapted & modified from https://github.com/facebook/react/issues/5465#issuecomment-157888325
// converts a promise returning function to a cancellable promise returning function.
function cancellablePromise(functionThatReturnsAPromise) {
	let isCanceled = false;

	if (typeof functionThatReturnsAPromise !== 'function') throw new Error('action is not a function')

	return {
		promise: (arg) => new Promise((resolve, reject) => {	
			functionThatReturnsAPromise(arg)
				.then((val)    => isCanceled ? reject({isCanceled: true}) : resolve(val))
				.catch((error) => isCanceled ? reject({isCanceled: true}) : reject(error))
		}),
		cancel: () => {
		  isCanceled = true
		}
	}
}

export default Choreo