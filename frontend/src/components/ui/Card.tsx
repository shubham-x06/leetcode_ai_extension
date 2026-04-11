import React from 'react';
import { useFadeUp } from '../../hooks/useFadeUp';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'accent';
  hoverable?: boolean;
  style?: React.CSSProperties;
  delay?: number;
  fade?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', variant = 'default', hoverable = false, style, delay = 0, fade = true, onClick }: CardProps) {
  const ref = useFadeUp(delay);

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
    },
    elevated: {
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-subtle)',
    },
    accent: {
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-accent)',
      borderLeft: '3px solid var(--accent)',
    },
  };

  const hoverHandlers = hoverable ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      e.currentTarget.style.borderColor = 'var(--border-default)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
      if (variant === 'accent') {
        e.currentTarget.style.borderColor = 'var(--border-accent)';
      } else {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }
    },
  } : {};

  return (
    <div
      ref={fade ? ref : undefined}
      className={`fade-up ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
        cursor: hoverable || onClick ? 'pointer' : 'default',
        ...variantStyles[variant],
        ...style,
      }}
      {...hoverHandlers}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="h3" style={{ color: 'var(--text-primary)' }}>{children}</h3>;
}
