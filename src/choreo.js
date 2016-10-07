import { pipeP } from 'ramda'

const Choreo = {
	create() {
		let sequences = []
		let isStarted = false
		return Object.create({
			// For async functions that need to be waited upon.
			addPromise(functionThatReturnsAPromise) {
				sequences.push(cancellablePromise(functionThatReturnsAPromise))
			},
			// Sequence is a normal function or an array of normal functions.
			add(sequence) {
				if (Array.isArray(sequence)) {
					sequence.forEach((s) => { sequences.push(cancellableTimeout(s, 1)) })
				} else {
					sequences.push(cancellableTimeout(sequence, 1))
				}
			},
			// Do nothing for sometime.
			wait(delay) {  
				sequences.push(cancellableTimeout((arg) => arg, delay))
			},
			popLast() {
				sequences.pop()
			},
			cancel() {
				sequences.map(sequence => sequence.cancel())
			},
			start() {
				if (!isStarted && sequences.length > 0) {
					pipeP(...(sequences.map(s => s.promise)))('')
					isStarted = true
				}
			}
		})
	},
	cancellableTimeout,
	cancellablePromise
}

// f is a normal function of arity 0. You can send it in curried 
function cancellableTimeout(f, milliseconds) { 
	let timerId = 0

	if (typeof f !== 'function') {
		throw new Error('action is not a function')
	}

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

	if (typeof functionThatReturnsAPromise !== 'function') {
		throw new Error('action is not a function')
	}
	
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