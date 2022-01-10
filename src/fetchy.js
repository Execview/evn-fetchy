import crossFetch from 'cross-fetch'
import AC from 'abort-controller';
import crossBtoa from 'btoa-lite'

const removeOurOptions = (options) => {
	const {body,debug,token,basic,method,timeout,headers,preview,jest,notJSON,leaveError,req_id, ...otherOptions} = options
	return otherOptions
}

export const fetchy = (url,options={}) => {
	const [fetchFunction, AbortControllerClass, toBase64] = [crossFetch, AC, crossBtoa]
	if(!url){console.log('WHERE IS THE LINK?!'); return}

	let body = options.body
	const jest = options.jest
	const previewMode = jest || options.preview!==undefined //for when you dont want to perform the fetch, but want to debug. (the value of options.preview is resolved)
	const debug = options.debug || (previewMode && !jest)
	const ntj = options.notJSON || previewMode
	const leaveError = options.leaveError || previewMode
	const token = options.token
	const basic = options.basic
	const req_id = options.req_id
	const timeout = options.timeout || 60000
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

	const debugLog = {url: url, fetchOptions: {...fetchOptions, body:body}}
	debug && console.log(debugLog)

	let fetchPromise = previewMode ? Promise.resolve(jest ? debugLog : options.preview) : fetchFunction(url, fetchOptions)
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