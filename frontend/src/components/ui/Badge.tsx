import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'Easy' | 'Medium' | 'Hard' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variants: Record<string, string> = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    Hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    outline: 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300',
  };
  return (
    <div className={`${base} ${variants[variant] ?? variants.default} ${className}`}>
      {children}
    </div>
  );
}
