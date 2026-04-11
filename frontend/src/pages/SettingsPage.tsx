import { useState } from 'react';
import Card from '../components/ui/Card';
import { useUser } from '../api/user';
import Skeleton from '../components/Skeleton';

export default function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const [theme, setTheme] = useState(user?.preferences?.theme || 'light');
  const [difficulty, setDifficulty] = useState(user?.preferences?.targetDifficulty || 'Mixed');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Profile Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LeetCode Username</label>
            <input
              type="text"
              value={user?.leetcodeUsername || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </Card>

      {/* Preferences Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* About Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <div className="text-gray-600 space-y-2">
          <p>
            <strong>LeetCode AI Companion</strong>
          </p>
          <p>Version 1.0.0</p>
          <p>Get AI-powered hints, problem recommendations, and track your LeetCode progress</p>
        </div>
      </Card>
    </div>
  );
}