import { pipeP } from './pipe'

const Choreo = {
	create() {
		// state variables
		let sequences = []
		let isStarted = false
		let nRepeat = 0

		//internal
		let inputSequence = []

		return Object.create({
			add(...args) {
				sequences = addToSequence(sequences, (s) => cancellableTimeout(s, 1), ...args)
				inputSequence.push({type:'function', data:args})
			},
			addPromise(...args) {
				sequences = addToSequence(sequences, (s) => cancellablePromise(s), ...args)
				inputSequence.push({type:'promise', data:args})
			},
			// Do nothing for sometime. Just return the input arg unaltered (arg) => arg
			wait(delay) {
				if (delay <= 0) throw new Error('wait time must be greater than zero.')

				sequences = addToSequence(sequences, (s) => cancellableTimeout(s, delay), (arg) => arg)
				inputSequence.push({type:'delay', data:delay})
			},
			popLast() {
				sequences.pop()
			},
			cancel() {
				sequences.forEach(sequence => sequence.cancel())
			},
			start(firstArg) {
				// Append a repeater hook
				let rs = repeater(inputSequence, nRepeat)
				this.add(rs)

				if (!isStarted) { // ensure you can only start once
					pipeP(...(sequences.map(s => s.promise)))(firstArg || '')
					isStarted = true
				}
			},
			loop(n) { // integer or infinity
				if (n <= 0) throw new Error('Repeat value must be > 0. Default value is 1')
				nRepeat = n - 1
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

	if (typeof f !== 'function') throw new Error('action is not a function')

	return {
		promise: (arg) => new Promise((resolve, reject) =>  {
			timerId = setTimeout(() => {
					timerId = 0 					        
					resolve(f.call(undefined, arg))
				}, milliseconds)
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