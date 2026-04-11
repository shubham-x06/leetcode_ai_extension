import React from 'react';

export function WeakTopicsBadges({ topics = [] }: { topics?: string[] }) {
  if (!topics.length) return null;
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your Weak Topics 🎯</p>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <span
            key={t}
            className="px-2.5 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
