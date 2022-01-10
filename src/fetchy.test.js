import fetchy from './fetchy.js'

test('normal login', () => {
	return (
		fetchy('https://api-alpha.evlem.net/api/login',{
			timeout: 10000,
			body:{username: 'test_user_52', password: 'password'}
		})
		.catch(r=>{console.log(r)})
		.then(data=>{
			expect(data.token).toBeTruthy()
		})
	)
})

test('basic auth', () => {
	return (
		fetchy('https://api-alpha.evlem.net/api/login',{
			timeout: 10000,
			body:{username: 'test_user_52', password: 'password'},
			basic: {user: "test", password: "test"},
			jest: true
		})
		.catch(r=>{console.log(r)})
		.then(log=>{
			expect(log.fetchOptions.headers.Authorization).toBeTruthy()
		})
	)
})
