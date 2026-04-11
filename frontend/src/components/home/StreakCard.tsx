import React from 'react';

interface StreakCardProps {
  streak?: number;
  longestStreak?: number;
  totalActiveDays?: number;
}

export function StreakCard({ streak = 0, longestStreak = 0, totalActiveDays = 0 }: StreakCardProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div className="text-center">
        <p className="text-2xl font-bold text-orange-500">🔥 {streak}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Streak</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-purple-500">{longestStreak}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Longest Streak</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-500">{totalActiveDays}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Days</p>
      </div>
    </div>
  );
}
