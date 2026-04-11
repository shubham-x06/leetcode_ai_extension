import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import HomePage from './HomePage';
import ProblemsPage from './ProblemsPage';
import ProgressPage from './ProgressPage';
import ContestPage from './ContestPage';
import AIMentorPage from './AIMentorPage';
import SettingsPage from './SettingsPage';

const NAV_ITEMS = [
  { to: '/', label: '🏠 Home', end: true },
  { to: '/progress', label: '📊 Progress' },
  { to: '/contest', label: '🏆 Contest' },
  { to: '/problems', label: '🧩 Problems' },
  { to: '/ai-mentor', label: '🤖 AI Mentor' },
  { to: '/settings', label: '⚙️ Settings' },
];

export default function DashboardLayout() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex h-screen overflow-hidden dark:bg-gray-950 dark:text-gray-50 bg-white text-gray-900">
      <aside className="w-56 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-base font-bold text-blue-600 dark:text-blue-400">LeetCode AI</h1>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="contest" element={<ContestPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="ai-mentor" element={<AIMentorPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
