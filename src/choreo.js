import { pipeP } from 'ramda'
//
// Usage: let sequence = Choreo.create()
// sequence.add(fun1)
// sequence.delay(1000)
// sequence.add(func2)
// and so on. fun1 and fun2 are regular functions.
// If you want to add a promise instead, do sequence.addPromise(promise)
//
// When you are ready to start the sequence, do sequence.start()
// THis will choreograph your functions as specified.
// If you need to cancel, do sequence.cancel() 
// This is especially useful if your components unmount while a sequence is in progress.

const Choreo = {
	create() {
		let sequences = [];
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
			wait(delay) { // Essentially do nothing for sometime. 
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
				if (sequences.length > 0) {
					pipeP(...(sequences.map(s => s.promise)))()
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