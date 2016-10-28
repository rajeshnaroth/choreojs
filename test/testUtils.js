
export const asyncPromise = (f, millisec) => {
	return (input) => new Promise((resolve, reject) =>  {
		setTimeout(() => { 
		        resolve(f.call(undefined, input))
		    }, millisec)
	})
}

export const timeInMillisec = () => (new Date()).getTime()