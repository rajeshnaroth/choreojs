import Choreo from '../src/choreo'
import expect from 'expect'
import {asyncPromise, timeInMillisec} from './testUtils'
const TIMING_ACCURACY_IN_MS = 50

describe('choreo.js', function() { // arrow function has no scope,
	this.timeout(10000);

	describe('Test setup', () => {
		it('should be ok', () => {
			expect(true).toBe.ok
		})
	})

	describe('Single add args', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];
		
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

	describe('Variable add args', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];
		
		beforeEach((done) => {
			seq.add(
				() => { counter[0]++ },
				() => { counter[1]++ },
				() => { counter[2]++ },
				() => { done() }
			)
			seq.start()
		})

		it('works with variable args', () => {
			expect(counter[0]).toEqual(1)
			expect(counter[1]).toEqual(1)
			expect(counter[2]).toEqual(1)
		})		
	})

	describe('Add arrays', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];
		
		beforeEach((done) => {
			seq.add([
				() => { counter[0]++ },
				() => { counter[1]++ },
				() => { counter[2]++ },
				() => { done() }
			])
			seq.start()
		})

		it(' can add arrays and call them', () => {
			expect(counter[0]).toEqual(1)
			expect(counter[1]).toEqual(1)
			expect(counter[2]).toEqual(1)
		})		
	})

	describe('Combination of args', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];
		
		beforeEach((done) => {
			seq.add(
				() => { counter[0]++ },
				[
					() => { counter[1]++ },
					() => { counter[2]++ },
					() => { done() }
				]
			)
			seq.start()
		})

		it(' can add arguments individually and as arrays ', () => {
			expect(counter[0]).toEqual(1)
			expect(counter[1]).toEqual(1)
			expect(counter[2]).toEqual(1)
		})		
	})

	describe('pop last works', () => {
		let seq = Choreo.create()
		let counter = [0, 0, 0];

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
			expect(Math.floor(Math.floor(triggerTiming[0]- startTime)/TIMING_ACCURACY_IN_MS)*TIMING_ACCURACY_IN_MS).toEqual(1000)
			expect(Math.floor(Math.floor(triggerTiming[1]- startTime)/TIMING_ACCURACY_IN_MS)*TIMING_ACCURACY_IN_MS).toEqual(2500)
			expect(Math.floor(Math.floor(triggerTiming[2]- startTime)/TIMING_ACCURACY_IN_MS)*TIMING_ACCURACY_IN_MS).toEqual(2600)
		})

	})

	describe('Values are passed through the chain', () => {
		let seq = Choreo.create()
		let chainedVal = '';

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

	describe('Can add Promises', () => {
		let seq = Choreo.create()
		let values = [];

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

	describe('Promises are called in sequence', () => {
		let seq = Choreo.create()
		let chainedVal = '';

		beforeEach((done) => {
			seq.add(() => { return 'a' }) // 'a' is the first input to the promise chain
			seq.addPromise(asyncPromise(val => val + 'b', 100))
			seq.wait(200)
			seq.addPromise(asyncPromise(val => val + 'c', 100))
			seq.addPromise(asyncPromise(val => val, 100))
			seq.add((val) => { chainedVal = val})
			seq.add(() => { done() })
			seq.start()
		})

		it('relays values through the chain', () => {
			expect(chainedVal).toEqual('abc')
		})
	})

	// negative conditions
	describe('negative conditions', () => {
		let triggerTiming = [];
		let startTime = 0;
		
		it('cannot add non function', () => {
			let seq = Choreo.create();
			expect(function(){
				seq.add({})
			}).toThrow(/action is not a function/)
		})

		it('cannot add non function as promise', () => {
			let seq = Choreo.create();
			expect(function(){
				seq.addPromise({})
			}).toThrow(/action is not a function/)
		})

		it('should not accept zero wait time', () => {
			let seq = Choreo.create();
			expect(function(){
				seq.wait(0)
			}).toThrow(/wait time must be greater than zero/)
		})

		it('should not accept negative wait time', () => {
			let seq = Choreo.create();
			expect(function(){
				seq.wait(-1)
			}).toThrow(/wait time must be greater than zero/)
		})

	})
		
})