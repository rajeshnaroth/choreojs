'use strict';
import Choreo from '../src/choreo'
console.log("one.js: ", Choreo);
        
console.log('examples/one.js start')
let sequence = Choreo.create()
sequence.add(() => {console.log("step 1"); return '1'})
sequence.wait(1000)
sequence.add((v) => {console.log("step 2", v); return v + '2'})
sequence.wait(2000)
sequence.add((v) => {console.log("step 3", v); return v + '3'})
sequence.start()

console.log('examples/one.js: done')