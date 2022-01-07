export const getOurCookie = (originalCookie,getProperty) => {
	const cookieString = decodeURIComponent(originalCookie);
	if(!cookieString || cookieString==='null' || cookieString==='undefined'){return null}
	const cookiePropertyMap = cookieString.split(';').map(property=>{return property.trimLeft().split("=")})
	const cookie = cookiePropertyMap.reduce((total,p)=>{return {...total,[p[0]]:p[1]}},{});
	if(getProperty){return cookie[getProperty]}
	return cookie;
}

export const setOurCookie = (setFunction, o, properties={}) => {
	if(Object.keys(o||{}).length===0){return}
	Object.entries(o).forEach(([c,v])=>{
		let expiration = '2970-01-01'
		if(properties[c] && properties[c].expires){expiration = properties[c].expires}
		const newCookie = v ? `${c}=${v}; expires=${new Date(expiration).toUTCString()}; path=/` : `${c}=; expires=${new Date('1970-01-01').toUTCString()}; path=/`
		console.log(newCookie)
		setFunction(newCookie)
	})
}
