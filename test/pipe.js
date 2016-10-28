import {pipeP} from '../src/pipe'
import expect from 'expect'
import {asyncPromise} from './testUtils'

describe('pipe.js', function() { // arrow function has no scope,

	describe('Test setup', () => {
		it('should be ok', () => {
			expect(true).toBe.ok
		})
	})

	describe('Promise runs', () => {
		let seq = []
		let counter = [0, 0, 0];
		
		beforeEach((done) => {
			seq.push(asyncPromise(val => { counter[0]++}, 100))
			seq.push(asyncPromise(val => { counter[1]++}, 100))
			seq.push(asyncPromise(val => { counter[2]++}, 100))

			let testSeq = pipeP(...seq)
			testSeq().then(() => { done() })
		})

		it('executes promises, not necessarily in order', () => {
			expect(counter[0]).toEqual(1)
			expect(counter[1]).toEqual(1)
			expect(counter[2]).toEqual(1)
		})		
	})

	describe('Promise runs in order', () => {
		let seq = []
		let chainedVal = '';
		
		beforeEach((done) => {
			seq.push(asyncPromise(val => val + 'b', 100))
			seq.push(asyncPromise(val => val + 'c', 100))

			let testSeq = pipeP(...seq)
			testSeq('a').then((lastVal) => { 
				chainedVal = lastVal
				done() 
			})
		})

		it('executes promises, in order', () => {
			expect(chainedVal).toEqual('abc')
		})		
	})

	describe('First one can take multiple args', () => {
		let seq = []
		let chainedVal = '';
		
		beforeEach((done) => {
			//seq.push(asyncPromise(val => 'a', 100))
			seq.push(asyncPromise((val1) => val1 + 'b', 100))
			seq.push(asyncPromise(val => val + 'c', 100))

			let testSeq = pipeP(...seq)
			testSeq('a').then((lastVal) => { 
				chainedVal = lastVal
				done() 
			})
		})

		it('first one can take multiple args', () => {
			expect(chainedVal).toEqual('abc')
		})		
	})

	describe('Excpetion handling', () => {

		it('rejects empty arguments', () => {
			expect(function(){
				pipeP()
			}).toThrow(/you must provide at least one promise to pipe/)
		})		
	})
})