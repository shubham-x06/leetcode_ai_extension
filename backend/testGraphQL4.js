fetch('https://leetcode.com/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ userContestRanking(username: "lee215") { attendedContestsCount rating globalRanking topPercentage totalParticipants } userContestRankingHistory(username: "lee215") { attended trendDirection problemsSolved totalProblems finishTimeInSeconds rating ranking contest { title startTime } } }' })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)));
