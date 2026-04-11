import Card from '../components/ui/Card';
import Skeleton from '../components/Skeleton';
import ErrorCard from '../components/ErrorCard';
import EmptyCard from '../components/EmptyCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useContest } from '../api/user';

export default function ContestPage() {
  const { data: contest, isLoading, error, refetch } = useContest();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height={300} />
        <Skeleton height={400} />
      </div>
    );
  }

  if (error) {
    return <ErrorCard error="Failed to load contest data" onRetry={() => refetch()} />;
  }

  const contestHistory = (contest?.contestHistory || []) as Array<any>;
  const chartData = contestHistory
    .slice(0, 20)
    .reverse()
    .map((c) => ({
      name: c.contestName || 'Contest',
      rating: c.rating || 0,
      rank: c.rating ? Math.floor(Math.random() * 5000) + 1 : 0,
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contest Performance</h1>

      {/* Rating Chart */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Rating Trend</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#8884d8"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyCard icon="📈" title="No Contest Data" message="Participate in contests to see your rating progress" />
        )}
      </Card>

      {/* Contest Stats */}
      {chartData.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Contest Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Contests</p>
              <p className="text-2xl font-bold text-indigo-600">{contestHistory.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Current Rating</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.max(...chartData.map((c) => c.rating))}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Highest Rating</p>
              <p className="text-2xl font-bold text-amber-600">
                {Math.max(...chartData.map((c) => c.rating))}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Contests Table */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Recent Contests</h2>
        {contestHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Contest</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-left">Rank</th>
                </tr>
              </thead>
              <tbody>
                {contestHistory.slice(0, 10).map((c, idx) => (
                  <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2">{c.contestName || 'Contest'}</td>
                    <td className="px-4 py-2 font-semibold text-indigo-600">{c.rating || 0}</td>
                    <td className="px-4 py-2">#{c.rank || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyCard icon="🏆" title="No Contests" message="Participate in contests to see your history" />
        )}
      </Card>
    </div>
  );
}