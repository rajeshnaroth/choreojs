# choreo
Choreograph functions and promises. Quite useful for sequencing UI and event transitions. ES6 only.

## installation
    npm install choreojs --save

## Usage
    import Choreo from 'choreojs'

    let sequence = Choreo.create()
    sequence.add(fun1)
    sequence.wait(1000)
    sequence.add(func2)
and so on. fun1 and fun2 are regular functions.
If you want to add a promise instead, do 

    sequence.addPromise(promise)

When you are ready to start the sequence, do 

    sequence.start()

This will choreograph your functions as specified.
If you need to cancel a sequence in progress, do 

    sequence.cancel() 

This is especially useful if your components unmount while a sequence is in progress.

Each function can return a value to be passed on to the next function/promise. Very useful if one of the events is an xhr promise such as getJson(url)

## Links
* [Live example on jsbin](https://jsbin.com/jivima/edit?html,js,output)
* [Choreojs Git](https://github.com/rajeshnaroth/choreo.git)

## How to run the examples
Choreo is ES6 only. You will need to use babel to help with the new 'import' syntax in ES6. To run the examples here do:

    git clone https://github.com/rajeshnaroth/choreo.git
    cd choreo
    npm install
    npm run example1

## This module uses ramda's pipe function. Why not just use that?
pipeP is a wonderful function for chaining promises. But Choreo lets you cancel the chain and any pending promises. Plus you get to chain regular functions and wait times to precisely choreograph your events.
