import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/Skeleton';
import ErrorCard from '../components/ErrorCard';
import EmptyCard from '../components/EmptyCard';
import { useProblems } from '../api/problems';
import { useUser } from '../api/user';

export default function ProblemDetailPage() {
  const { titleSlug } = useParams<{ titleSlug: string }>();
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const { data: problems, isLoading, error, refetch } = useProblems({ search: titleSlug });
  const { data: user } = useUser();

  if (!titleSlug) {
    return <EmptyCard icon="❌" title="Invalid Problem" message="Problem not found" />;
  }

  const problem = problems?.problems?.find((p: any) => p.titleSlug === titleSlug);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height={300} />
        <Skeleton height={400} />
      </div>
    );
  }

  if (error) {
    return <ErrorCard error="Failed to load problem details" onRetry={() => refetch()} />;
  }

  if (!problem) {
    return <EmptyCard icon="🔍" title="Problem Not Found" message="This problem doesn't exist" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Problem Description - Main Column */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <button
            onClick={() => navigate('/problems')}
            className="text-indigo-600 hover:underline mb-4"
          >
            ← Back to Problems
          </button>
        </div>

        {/* Title & Difficulty */}
        <Card>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
              <p className="text-gray-600 text-sm">Slug: {problem.titleSlug}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                problem.difficulty === 'Easy'
                  ? 'bg-green-100 text-green-800'
                  : problem.difficulty === 'Medium'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
        </Card>

        {/* Problem Description */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">
              {/* Display first 10 words of description as placeholder */}
              This is a {problem.difficulty} difficulty problem about {problem.tags?.[0] || 'coding'}.
              Mock problem description - connect to real LeetCode API for full details.
            </p>
          </div>
        </Card>

        {/* Tags */}
        {problem.tags && problem.tags.length > 0 && (
          <Card>
            <h3 className="font-semibold mb-3">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag: string) => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Stats */}
        <Card>
          <h3 className="font-semibold mb-3">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Acceptance Rate</p>
              <p className="text-2xl font-bold text-indigo-600">~40%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Submissions</p>
              <p className="text-2xl font-bold">1.2M+</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar - Code Editor & Actions */}
      <div className="space-y-4">
        {/* Language Selector */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </Card>

        {/* Code Editor Area */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm h-64 overflow-auto">
            <pre>{`# Define your solution here
def solve(nums):
    # Code here
    pass`}</pre>
          </div>
        </Card>

        {/* AI Actions */}
        <Card>
          <h3 className="font-semibold mb-3">AI Assistant</h3>
          <div className="space-y-2">
            <Button variant="primary" className="w-full" size="sm">
              💡 Get Hint
            </Button>
            <Button variant="secondary" className="w-full" size="sm">
              ✨ AI Solution
            </Button>
            <Button variant="secondary" className="w-full" size="sm">
              🔍 Analyze Code
            </Button>
          </div>
        </Card>

        {/* Submit Button */}
        <Button variant="primary" className="w-full">
          Submit Solution
        </Button>

        {/* Bookmark */}
        <Card>
          <button className="w-full px-4 py-2 text-center border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
            🔖 Add to Bookmarks
          </button>
        </Card>
      </div>
    </div>
  );
}
