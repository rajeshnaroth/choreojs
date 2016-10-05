'use strict';
import Choreo from '../src/choreo'
import expect from 'expect'
const TIMING_ACCURACY = 50

const timeInMillisec = () => (new Date()).getTime()

const asyncPromise = (f, millisec) => {
	return (input) => new Promise((resolve, reject) =>  {
		setTimeout(() => { 
		        resolve(f(input))
		    }, millisec)
	})
}

describe('Choreo', function() {
	describe('Test setup', () => {
		it('should be ok', () => {
			expect(true).toBe.ok
		})
	})
	
	describe('Adds functions and executes them', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];
		this.timeout(5000);

		beforeEach((done) => {
			seq.add(() => { counter[0]++ })
			seq.add(() => { counter[1]++ })
			seq.add(() => { counter[2]++ })
			seq.add(() => { done() })
			seq.start()
		})

		it('adds and calls functions', () => {
			expect(counter[0]).toEqual(1)
			expect(counter[1]).toEqual(1)
			expect(counter[2]).toEqual(1)
		})		
	})

	describe('pop last works', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];
		this.timeout(5000);

		beforeEach((done) => {
			seq.add(() => { counter[0]++ })
			seq.add(() => { counter[1]++ })
			seq.add(() => { counter[2]++ })
			seq.popLast()
			seq.add(() => { done() })
			seq.start()
		})

		it('adds and calls functions', () => {
			expect(counter[0]).toEqual(1)
			expect(counter[1]).toEqual(1)
			expect(counter[2]).toEqual(0)
		})
		
	})

	describe('timings are triggered properly', () => {
		let triggerTiming = [];
		let startTime = 0;
		let seq = Choreo.create();
		this.timeout(5000);
		console.log("index.js: ", timeInMillisec());
		        
		beforeEach((done) => {
			seq.wait(1000)
			seq.add(() => { triggerTiming[0] = timeInMillisec()})
			seq.wait(1500)
			seq.add(() => { triggerTiming[1] = timeInMillisec()})
			seq.wait(100)
			seq.add(() => { triggerTiming[2] = timeInMillisec()})
			seq.add(() => { done() })
			startTime = timeInMillisec()
			seq.start()
		})

		it('triggers with correct timings', () => {
			expect(Math.floor(Math.floor(triggerTiming[0]- startTime)/TIMING_ACCURACY)*TIMING_ACCURACY).toEqual(1000)
			expect(Math.floor(Math.floor(triggerTiming[1]- startTime)/TIMING_ACCURACY)*TIMING_ACCURACY).toEqual(2500)
			expect(Math.floor(Math.floor(triggerTiming[2]- startTime)/TIMING_ACCURACY)*TIMING_ACCURACY).toEqual(2600)
		})

	})

	describe('Values are passed through the chain', () => {
		let seq = Choreo.create()
		let chainedVal = '';
		this.timeout(5000);

		beforeEach((done) => {
			seq.add(() => 'a')
			seq.add((val) => val + 'b')
			seq.add((val) => val + 'c')
			seq.add((val) => { chainedVal = val })
			seq.add(() => { done() })
			seq.start()
		})

		it('values are passed through a chain', () => {
			expect(chainedVal).toEqual('abc')
		})
	})

	describe('Values are passed through the chain even with waits', () => {
		let seq = Choreo.create()
		let values = [];
		this.timeout(5000);

		beforeEach((done) => {
			seq.add(() => { return 'a' })
			seq.wait(100)
			seq.add((val) => { values.push(val); return 'b'  })
			seq.wait(100)
			seq.add((val) => { values.push(val); return 'c'  })
			seq.wait(100)
			seq.add((val) => { values.push(val) })
			seq.add(() => { done() })
			seq.start()
		})

		it('values are passed through a chain', () => {
			expect(values[0]).toEqual('a')
			expect(values[1]).toEqual('b')
			expect(values[2]).toEqual('c')
		})
	})

	describe('promises work', () => {
		let seq = Choreo.create()
		let values = [];
		this.timeout(5000);

		beforeEach((done) => {
			seq.add(() => { return 'a' })
			seq.addPromise(asyncPromise(val => val, 1000))
			seq.add((val) => { values.push(val);})
			seq.add(() => { done() })
			seq.start()
		})

		it('timeout was called', () => {
			expect(values[0]).toEqual('a')
		})
	})

	describe('promises are called in sequence', () => {
		let seq = Choreo.create()
		let chainedVal = '';
		this.timeout(5000);

		beforeEach((done) => {
			seq.add(() => { return 'a' }) // 'a' is the first input to the promise chain
			seq.addPromise(asyncPromise(val => val + 'b', 100))
			seq.addPromise(asyncPromise(val => val + 'c', 100))
			seq.addPromise(asyncPromise(val => val, 100))
			seq.add((val) => { chainedVal =  val})
			seq.add(() => { done() })
			seq.start()
		})

		it('calls timeouts in chain', () => {
			expect(chainedVal).toEqual('abc')
		})
	})
		
})