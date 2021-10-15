function makeAccount(username, password) {
  const result = fetch('/api/createaccount', {
    headers: {
      'apipassword': 'g7shsd8fasdofj8j4wo9fj3w9jfwdfkj',
      'username': username,
      'password': password
    }
  })
  console.log(result)
}