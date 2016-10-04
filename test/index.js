'use strict';
import Choreo from '../src/choreo'
import expect from 'expect'

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

	describe('timings are triggered properly', () => {})
	describe('values are passed through the chain', () => {})
	describe('promises work', () => {})
		
})