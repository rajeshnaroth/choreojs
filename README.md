# choreo.js
Choreograph functions and promises. Quite useful for sequencing UI and event transitions that can be canelled midway.
Written in ES6.

## Installation
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

## Use case

### 1
When User clicks on a button.
- You display a spinner
- Make an ajax call
- Stop the spinner
- Display the results (Maybe add some cool css transitions)

This is quite straightforward with choreojs
The following two lines will kick off a json request (assuming that getJson is a promise)

    seq.add(() => $('#spinner').show())
    seq.add(() => api) // Remember, you can relay data from one to next. Very similar to pointfree style in pipeP
    seq.addPromise(getJson)
    seq.add((val) => { $('#spinner').hide(); return val;} ) // you simply relay the json result to the next function
    seq.add((val) => $('#results').text(val) )

## Live Examples for React
* [Choreograph ajax calls and css transitions](https://jsbin.com/rinudu/edit?js,output)
* [Choreograph entry and exit apparance of a form](https://jsbin.com/koqoka/edit?js,output)
* [Simple choreographed actions](https://jsbin.com/jivima/edit?html,js,output)

## Source
* [Choreojs Git](https://github.com/rajeshnaroth/choreo.git)

## How to run the examples in the package
Choreo is ES6 only. You will need to use babel to help with the new 'import' syntax in ES6. To run the examples here do:

    git clone https://github.com/rajeshnaroth/choreo.git
    cd choreo
    npm install
    npm run example1


