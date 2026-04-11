import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/Skeleton';
import ErrorCard from '../components/ErrorCard';
import EmptyCard from '../components/EmptyCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RecommendationPage() {
  const navigate = useNavigate();
  const isLoading = false;
  const error = null;

  // Mock recommendations data
  const recommendations = [
    {
      id: 1,
      title: 'Two Sum',
      titleSlug: 'two-sum',
      difficulty: 'Easy',
      reason: 'Hash Map is your weakest topic (20% mastery)',
      estimatedTime: '15 min',
      tags: ['Array', 'Hash-Map'],
    },
    {
      id: 2,
      title: 'LRU Cache',
      titleSlug: 'lru-cache',
      difficulty: 'Medium',
      reason: 'Design pattern practice - good for your level',
      estimatedTime: '45 min',
      tags: ['Design', 'Hash-Map', 'Linked-List'],
    },
    {
      id: 3,
      title: 'Word Ladder',
      titleSlug: 'word-ladder',
      difficulty: 'Hard',
      reason: 'BFS mastery builder (currently 65% confident)',
      estimatedTime: '60 min',
      tags: ['BFS', 'Graph'],
    },
  ];

  // Mock streak data
  const streakData = [
    { day: 'Mon', problems: 2 },
    { day: 'Tue', problems: 3 },
    { day: 'Wed', problems: 1 },
    { day: 'Thu', problems: 4 },
    { day: 'Fri', problems: 2 },
    { day: 'Sat', problems: 5 },
    { day: 'Sun', problems: 3 },
  ];

  if (error) {
    return <ErrorCard error="Failed to load recommendations" onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Personalized Recommendations</h1>

      {/* Daily Motivation */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-900 mb-2">🚀 Today's Goal</h2>
            <p className="text-purple-700 mb-4">
              Solve 3 problems focusing on <strong>Hash Tables</strong> to improve your weak area.
            </p>
            <div className="text-sm text-purple-600">
              📊 Current Streak: <strong>12 days</strong> | Problems Solved This Week: <strong>18</strong>
            </div>
          </div>
          <div className="text-5xl">🎯</div>
        </div>
      </Card>

      {/* Weekly Activity Chart */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">This Week's Activity</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={streakData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="problems" stroke="#8884d8" strokeWidth={2} dot={{ fill: '#8884d8' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Recommended Problems */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">🎓 Recommended For You</h2>
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <Card key={rec.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-indigo-600">#{idx + 1}</span>
                    <button
                      onClick={() => navigate(`/problem/${rec.titleSlug}`)}
                      className="text-lg font-semibold text-indigo-600 hover:underline"
                    >
                      {rec.title}
                    </button>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        rec.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-800'
                          : rec.difficulty === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rec.difficulty}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3">{rec.reason}</p>

                  <div className="flex gap-2 mb-3">
                    {rec.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">⏱️ Est. time: {rec.estimatedTime}</div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => navigate(`/problem/${rec.titleSlug}`)}
                >
                  Start
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Weak Topics Summary */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">📋 Your Weak Topics</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { topic: 'Hash Tables', mastery: 20, recommended: 8 },
            { topic: 'DP', mastery: 35, recommended: 12 },
            { topic: 'Graph', mastery: 45, recommended: 7 },
            { topic: 'String', mastery: 60, recommended: 3 },
          ].map((item) => (
            <div key={item.topic} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{item.topic}</h3>
                <span className="text-sm text-gray-600">{item.mastery}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${item.mastery}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{item.recommended} problems suggested</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Custom Study Plan */}
      <Card className="border-2 border-dashed border-indigo-300">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">📚 Create Custom Study Plan</h2>
          <p className="text-gray-600 mb-4">
            Build your own personalized learning path targeting specific topics
          </p>
          <Button variant="secondary">Create Study Plan</Button>
        </div>
      </Card>
    </div>
  );
}
