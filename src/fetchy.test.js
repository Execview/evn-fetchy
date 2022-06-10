import fetchy from './fetchy.js'

const token = ""

test('normal login', () => {
	return (
		fetchy('https://api-alpha.evlem.net/api/login',{
			timeout: 10000,
			body:{username: 'test_user_52', password: 'password'}
		})
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
		.then(log=>{
			expect(log.fetchOptions.headers.Authorization).toBeTruthy()
		})
	)
})

// test('empty body', () => {
// 	return (
// 		fetchy('https://api-alpha.evlem.net/api/org_role_list/884fa854-b9a3-48e5-82f1-395cee864a47',{
// 			timeout: 10000,
// 			token
// 		})
// 		.then(log=>{
// 			console.log(log)
// 			expect(!log).toBeTruthy()
// 		})
// 	)
// })
