import { pipeP } from 'ramda'

const Choreo = {
	create() {
		// state variable
		let sequences = []
		let isStarted = false

		return Object.create({
			add(...args) {
				sequences = addToSequence(sequences, (s) => cancellableTimeout(s, 1), ...args)
			},
			addPromise(...args) {
				sequences = addToSequence(sequences, (s) => cancellablePromise(s), ...args)
			},
			// Do nothing for sometime.
			wait(delay) {
				if (delay <= 0) throw new Error('wait time must be greater than zero.')

				sequences.push(cancellableTimeout((arg) => arg, delay))
			},
			popLast() {
				sequences.pop()
			},
			cancel() {
				sequences.forEach(sequence => sequence.cancel())
			},
			start(arg) {
				if (!isStarted && sequences.length > 0) {
					pipeP(...(sequences.map(s => s.promise)))(arg || '')
					isStarted = true
				}
			}
		})
	},
	cancellableTimeout,
	cancellablePromise
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
			timerId = setTimeout(
				() => { 
					timerId = 0 					        
					resolve(f(arg))
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