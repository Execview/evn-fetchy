import nodeFetch from 'node-fetch'
import AC from 'abort-controller';

const removeOurOptions = (options) => {
	const {body,debug,token,basic,method,timeout,headers,preview,notJSON,leaveError,req_id, ...otherOptions} = options
	return otherOptions
}

const globalStringOrAlt = (globalString, alt) =>{
	let result = alt
	try {
		result = eval(globalString)
	} catch (e) {

	}
	return result
}

const nodeBTOA = (str) => (new Buffer.from(str,'ascii')).toString('base64')

export const fetchy = (url,options={}) => {
	const [fetchFunction, AbortControllerClass, toBase64] = [globalStringOrAlt('fetch', nodeFetch),globalStringOrAlt('AbortController', AC), globalStringOrAlt('btoa', nodeBTOA)]
	if(!url){console.log('WHERE IS THE LINK?!'); return}

	let body = options.body
	const previewMode = options.preview!==undefined //for when you dont want to perform the fetch, but want to debug. (the value of options.preview is resolved)
	const debug = options.debug || previewMode
	const ntj = options.notJSON || previewMode
	const leaveError = options.leaveError || previewMode
	const token = options.token
	const basic = options.basic
	const req_id = options.req_id
	const timeout = options.timeout || 3000
	const otherOptions = removeOurOptions(options)


	const hasBody = body!==undefined
	let method = options.method || (hasBody ? 'POST': 'GET')

	let headers = {}
	if(method!=='GET'){headers["Content-Type"] = "application/json"}
	if(req_id){headers['x-request-id'] = req_id}
	
	let controller = new AbortControllerClass();
	let fetchOptions = {
		signal: controller.signal,
		method:method,
		headers: {...headers, ...options.headers},
		...otherOptions
	}
	if(hasBody){
		const contentType = fetchOptions.headers["Content-Type"] || ''
		let fetchBody = body
		if(typeof(body)!=="string" && ['json','text'].some(t=>contentType.includes(t))){fetchBody = JSON.stringify(fetchBody)}
		fetchOptions.body = fetchBody
	}
	
	if(token){fetchOptions.headers["Authorization"] = `Bearer ${token}`}
	if(basic){
		const alreadyString = typeof(basic)==='string'
		if(!alreadyString && (!basic.user || !basic.password)){return Promise.reject('provide user and password for basic auth!')}
		const basicString = alreadyString ? basic : toBase64(`${basic.user}:${basic.password}`)
		fetchOptions.headers["Authorization"] = `Basic ${basicString}`
	}

	debug && console.log({url: url, fetchOptions: {...fetchOptions, body:body}})

	let fetchPromise = previewMode ? Promise.resolve(options.preview) : fetchFunction(url, fetchOptions)
	if(!previewMode){
		fetchPromise = fetchPromise.then(res=>res.ok ? res : (leaveError ? Promise.reject(res) : res.text().then(err=>Promise.reject(err))))
		if(!ntj){fetchPromise = fetchPromise.then(res=>res.json())}
	}
	
	if(debug){fetchPromise = fetchPromise.then((res)=>{console.log(res); return res})}
	return Promise.race([
		fetchPromise,
		new Promise((resolve, reject) => setTimeout(() => {reject('too slow! -> '+url); controller.abort()}, timeout))
	])
}

export default fetchy