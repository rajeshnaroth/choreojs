'use strict';
import Choreo from '../src/choreo'

let sequence = Choreo.create()
sequence.add(() => {console.log("step 1"); return '1'})
sequence.wait(1000)
sequence.add((v) => {console.log("step 2", v); return v + '2'})
sequence.wait(2000)
sequence.add((v) => {console.log("step 3", v); return v + '3'})
sequence.start()

console.log("one.js: ", 'done')