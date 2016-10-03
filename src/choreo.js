import { pipeP } from 'ramda'

const Choreo = {
	create() {
		let sequences = []
		let isStarted = false
		return Object.create({
			// For async functions that need to be waited upon.
			addPromise(promise) {
				sequences.push(
					cancellablePromise(promise)
				)
			},
			// Sequence is a normal function.
			add(sequence) {
				sequences.push(
					cancellableTimeout(sequence, 1)
				)
			},
			// Do nothing for sometime.
			wait(delay) {  
				sequences.push(
					cancellableTimeout((arg) => arg, delay)
				)
			},
			popLast() {
				sequences.pop()
			},
			cancel() {
				sequences.map(sequence => sequence.cancel())
			},
			start() {
				if (!isStarted && sequences.length > 0) {
					pipeP(...(sequences.map(s => s.promise)))()
					isStarted = true
				}
			}
		})
	}
}

// f is a normal function of arity 0. You can send it in curried 
export const cancellableTimeout = (f, milliseconds) => { 
	let timerId = 0
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

export const cancellablePromise = (promiseReturningFunction) => {
	let isCanceled = false;

	return {
		promise: (arg) => new Promise((resolve, reject) => {
			promiseReturningFunction()
				.then(() => isCanceled ? reject({isCanceled: true}) : resolve(arg))
				.catch((error) => isCanceled ? reject({isCanceled: true}) : reject(error))
		}),
		cancel() {
		  isCanceled = true;
		}
	}
}

export default Choreo