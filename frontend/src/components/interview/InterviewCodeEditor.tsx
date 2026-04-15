import React from 'react';

interface Props {
  code: string;
  onChange: (val: string) => void;
  language: string;
  disabled: boolean;
  onSubmitCode?: () => void;
  isSending?: boolean;
}

export function InterviewCodeEditor({ code, onChange, language, disabled, onSubmitCode, isSending }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 4 spaces instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newVal = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newVal);
      // Move cursor after the spaces
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minHeight: 0,
    }}>
      {/* Editor header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px var(--space-4)', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-tertiary)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
          {language} — Your solution
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => onChange('')}
            disabled={disabled}
            style={{
              background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: 12, color: 'var(--text-muted)',
              padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            }}
            title="Clear editor"
          >
            Clear
          </button>
          {onSubmitCode && (
            <button
              onClick={onSubmitCode}
              disabled={disabled || isSending || !code.trim()}
              style={{
                background: 'var(--accent)', border: 'none', cursor: (disabled || isSending || !code.trim()) ? 'not-allowed' : 'pointer',
                fontSize: 12, fontWeight: 600, color: '#fff',
                padding: '4px 14px', borderRadius: 'var(--radius-sm)',
                opacity: (disabled || isSending || !code.trim()) ? 0.6 : 1,
              }}
            >
              {isSending ? 'Submitting...' : 'Submit Code'}
            </button>
          )}
        </div>
      </div>

      {/* Line numbers + textarea */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Line numbers */}
        <div style={{
          flexShrink: 0, width: 44, padding: '14px 8px',
          background: 'var(--bg-tertiary)', borderRight: '1px solid var(--border-subtle)',
          overflowY: 'hidden', userSelect: 'none',
          fontFamily: 'var(--font-mono, monospace)', fontSize: 13, lineHeight: '22px',
          color: 'var(--text-muted)', textAlign: 'right',
        }}>
          {(code || '').split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          spellCheck={false}
          placeholder={`// Write your solution here\n// Think out loud in the chat panel\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};`}
          style={{
            flex: 1, padding: '14px var(--space-4)',
            background: '#0A0A14', color: '#E2E8F0',
            border: 'none', outline: 'none', resize: 'none',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Courier New', monospace",
            fontSize: 13, lineHeight: '22px', letterSpacing: '0.02em',
            overflowY: 'auto',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
          }}
        />
      </div>

      {/* Character count */}
      <div style={{
        padding: '6px var(--space-4)', borderTop: '1px solid var(--border-subtle)',
        fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)',
        flexShrink: 0,
      }}>
        {code.split('\n').length} lines · {code.length} chars
      </div>
    </div>
  );
}
