import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const sizes = { sm: 16, md: 24, lg: 36 };

export function Spinner({ size = 'md', style }: SpinnerProps) {
  const px = sizes[size];
  return (
    <span style={{
      display: 'inline-block',
      width: px,
      height: px,
      borderRadius: '50%',
      border: '2.5px solid var(--border-strong)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.8s linear infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}
