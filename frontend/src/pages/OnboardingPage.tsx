import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { linkLeetCode } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { Search, Link as LinkIcon, AlertCircle, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a valid LeetCode username.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await linkLeetCode(username.trim());
      if (res.success) {
        updateUser({ leetcodeUsername: res.leetcodeUsername });
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Could not link your LeetCode account. Please check the username and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full blur-3xl bg-gradient-to-b from-blue-100/50 to-white dark:from-blue-900/10 dark:to-gray-950 opacity-60" />
      </div>

      <div className="max-w-md w-full space-y-8 p-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800/60 z-10">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-6 transform transition-transform hover:scale-105 duration-300">
            <LinkIcon className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Link Your LeetCode
          </h2>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            We need your LeetCode username to analyze your profile, track your streak, and provide personalized AI tutoring.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30 animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <input
              id="leetcode-username"
              name="leetcodeUsername"
              type="text"
              required
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none block w-full pl-11 pr-4 py-4 border border-gray-200 dark:border-gray-700/80 rounded-xl leading-5 bg-white dark:bg-gray-800/80 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all sm:text-sm disabled:opacity-50 font-medium"
              placeholder="e.g. neetcode"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Connect Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
