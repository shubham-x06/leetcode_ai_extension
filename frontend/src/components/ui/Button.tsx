import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.5 : 1,
    transition: 'var(--transition-fast)',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '7px 14px', fontSize: '13px' },
    md: { padding: '10px 20px', fontSize: '15px' },
    lg: { padding: '13px 28px', fontSize: '16px' },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
    },
    secondary: {
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
    },
    danger: {
      background: 'transparent',
      color: 'var(--error)',
      border: '1px solid var(--error-subtle)',
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled || isLoading) return;
        const el = e.currentTarget;
        if (variant === 'primary') {
          el.style.background = 'var(--accent-hover)';
          el.style.boxShadow = 'var(--shadow-accent)';
          el.style.transform = 'translateY(-1px)';
        } else if (variant === 'secondary') {
          el.style.borderColor = 'var(--border-strong)';
          el.style.background = 'var(--bg-elevated)';
        } else if (variant === 'ghost') {
          el.style.color = 'var(--text-primary)';
          el.style.background = 'var(--accent-subtle)';
        } else if (variant === 'danger') {
          el.style.background = 'var(--error-subtle)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        if (variant === 'primary') {
          el.style.background = 'var(--accent)';
          el.style.boxShadow = 'none';
          el.style.transform = 'none';
        } else if (variant === 'secondary') {
          el.style.borderColor = 'var(--border-default)';
          el.style.background = 'var(--bg-surface)';
        } else if (variant === 'ghost') {
          el.style.color = 'var(--text-secondary)';
          el.style.background = 'transparent';
        } else if (variant === 'danger') {
          el.style.background = 'transparent';
        }
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { if (!disabled) e.currentTarget.style.transform = variant === 'primary' ? 'translateY(-1px)' : 'none'; }}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            animation: 'spin 0.8s linear infinite',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span>{children}</span>
        </>
      ) : children}
    </button>
  );
}
