import crossFetch from 'cross-fetch'
import AC from 'abort-controller';
import crossBtoa from 'btoa-lite'

const removeOurOptions = (options) => {
	const {body,debug,token,basic,method,timeout,headers,preview,jest,notJSON,leaveError,query,variables, ...otherOptions} = options
	return otherOptions
}

export const fetchy = (url,options={}) => {
	const [fetchFunction, AbortControllerClass, toBase64] = [crossFetch, AC, crossBtoa]
	if(!url){console.log('WHERE IS THE LINK?!'); return}

	let graphQLBody = undefined
	if(options.query){graphQLBody = {query: options.query}}
	if(graphQLBody && options.variables){graphQLBody = {...graphQLBody, variables: options.variables}}

	let body = options.body || graphQLBody
	const jest = options.jest
	const previewMode = jest || options.preview!==undefined //for when you dont want to perform the fetch, but want to debug. (the value of options.preview is resolved)
	const debug = options.debug || (previewMode && !jest)
	const ntj = options.notJSON || previewMode
	const leaveError = options.leaveError || previewMode
	const token = options.token
	const basic = options.basic
	const timeout = options.timeout
	const otherOptions = removeOurOptions(options)


	const hasBody = body!==undefined
	let method = options.method || (hasBody ? 'POST': 'GET')

	let headers = {}
	if(method!=='GET'){headers["Content-Type"] = "application/json"}
	if(token){headers["Authorization"] = `Bearer ${token}`}
	if(basic){
		let basicString = ''
		if(typeof(basic)==='string'){
			basicString = basic
		} else {
			if(basic.user && basic.password){
				basicString = toBase64(`${basic.user}:${basic.password}`)
			} else {
				return Promise.reject('provide user and password for basic auth!')
			}
		}
		headers["Authorization"] = `Basic ${basicString}`
	}
	
	let controller = null; //for controller.signal if a timeout is set
	let fetchOptions = {
		method:method,
		headers: {...headers, ...options.headers},
		...otherOptions
	}
	if(!fetchOptions.headers["Content-Type"]){ delete fetchOptions.headers["Content-Type"] }
	if(hasBody){
		fetchOptions.body = (typeof(body)!=="string" && (fetchOptions.headers["Content-Type"]||'').includes("json")) ? JSON.stringify(body) : body
	}
	if(timeout){
		controller = new AbortControllerClass()
		fetchOptions.signal = controller.signal
	}

	const debugLog = {url: url, fetchOptions: {...fetchOptions, body:body}}
	debug && console.log(debugLog)

	let fetchPromise = previewMode ? Promise.resolve(jest ? debugLog : options.preview) : fetchFunction(url, fetchOptions)
	if(!previewMode){
		fetchPromise = fetchPromise.then(res=>res.ok ? res : (leaveError ? Promise.reject(res) : res.text().then(err=>Promise.reject(err))))
		if(!ntj){fetchPromise = fetchPromise.then(res=>res.json())}
	}
	
	if(debug){fetchPromise = fetchPromise.then((res)=>{console.log(res); return res})}
	
	return !timeout ? fetchPromise : Promise.race([
		fetchPromise,
		new Promise((resolve, reject) => setTimeout(() => {reject('too slow! -> '+url); controller.abort()}, timeout))
	]) 
}

export default fetchy