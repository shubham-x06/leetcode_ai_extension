import React from 'react';

interface WelcomeCardProps {
  user?: { name?: string; avatarUrl?: string; leetcodeUsername?: string | null };
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      {user?.avatarUrl && (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-14 h-14 rounded-full border-2 border-white/50"
        />
      )}
      <div>
        <p className="text-sm text-white/80">Welcome back,</p>
        <h2 className="text-xl font-bold">{user?.name || 'Coder'}</h2>
        {user?.leetcodeUsername && (
          <p className="text-sm text-white/70 mt-0.5">@{user.leetcodeUsername}</p>
        )}
      </div>
    </div>
  );
}
