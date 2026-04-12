import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle theme"
      style={{
        position: 'relative',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface)';
        e.currentTarget.style.borderColor = 'var(--accent-subtle)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--bg-tertiary)';
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: theme === 'dark' ? 'translateY(14px)' : 'translateY(-14px)',
        }}
      >
        <Moon size={20} style={{ opacity: theme === 'dark' ? 1 : 0, transition: 'opacity 0.3s' }} />
        <Sun size={20} style={{ opacity: theme === 'light' ? 1 : 0, transition: 'opacity 0.3s' }} />
      </div>

      <style>{`
        .theme-toggle:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </button>
  );
};
