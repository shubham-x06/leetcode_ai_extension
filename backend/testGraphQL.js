fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ matchedUser(username: "shubham-x06") { profile { ranking } } }' })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)));
