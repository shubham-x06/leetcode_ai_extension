import React, { useRef } from 'react';

const LANGUAGE_STARTERS: Record<string, string> = {
  python: '# Write your solution here\n\nclass Solution:\n    def solve(self):\n        pass\n',
  javascript: '// Write your solution here\n\n/**\n * @param {number[]} nums\n * @return {number}\n */\nvar solution = function() {\n    \n};\n',
  typescript: '// Write your solution here\n\nfunction solution(): void {\n    \n}\n',
  java: '// Write your solution here\n\nclass Solution {\n    public void solve() {\n        \n    }\n}\n',
  cpp: '// Write your solution here\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};\n',
  go: '// Write your solution here\n\npackage main\n\nfunc solution() {\n    \n}\n',
  rust: '// Write your solution here\n\nfn solution() {\n    \n}\n',
};

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'];

interface Props {
  code: string;
  onChange: (val: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  disabled: boolean;
}

export function InterviewCodeEditor({
  code, onChange, onRun, onSubmit, isRunning, isSubmitting, isSubmitted, disabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [language, setLanguage] = React.useState('python');

  const handleLangChange = (lang: string) => {
    setLanguage(lang);
    if (!code.trim() || code === LANGUAGE_STARTERS[language]) {
      onChange(LANGUAGE_STARTERS[lang] || '');
    }
  };

  // Initialize with starter
  React.useEffect(() => {
    if (!code) onChange(LANGUAGE_STARTERS[language] || '');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = code.substring(0, start) + '    ' + code.substring(end);
      onChange(newVal);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + 4; }, 0);
    }
    // Ctrl+Enter = Run
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isRunning && !disabled) onRun();
    }
  };

  const lineCount = Math.max(1, (code || '').split('\n').length);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#0D0D16', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)', overflow: 'hidden', minHeight: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Editor header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#151522', borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0, gap: 'var(--space-4)',
      }}>
        {/* macOS dots + language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2)' }} />
            ))}
          </div>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
          <select
            value={language}
            onChange={e => handleLangChange(e.target.value)}
            style={{
              background: 'transparent', border: 'none',
              color: '#E2E8F0', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', outline: 'none', padding: 0,
              appearance: 'none', fontFamily: 'var(--font-sans)'
            }}
          >
            {LANGUAGES.map(l => (
              <option key={l} value={l} style={{ background: '#1A1A2E' }}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Reset */}
          <button
            onClick={() => onChange(LANGUAGE_STARTERS[language] || '')}
            style={{
              padding: '6px 12px', background: 'transparent',
              border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>

          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      {/* Code area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {/* Line numbers */}
        <div style={{
          flexShrink: 0, width: 44, padding: '16px 12px 16px 0',
          background: 'rgba(0,0,0,0.15)',
          overflowY: 'hidden', userSelect: 'none',
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: 13, lineHeight: '24px',
          color: 'rgba(255,255,255,0.15)', textAlign: 'right',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSubmitted}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            flex: 1, padding: '16px 16px',
            background: 'transparent',
            color: '#E2E8F0', border: 'none', outline: 'none', resize: 'none',
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontSize: 13, lineHeight: '24px', letterSpacing: '0.02em',
            overflowY: 'auto', tabSize: 4,
            cursor: (disabled || isSubmitted) ? 'not-allowed' : 'text',
            opacity: (disabled || isSubmitted) ? 0.6 : 1,
            caretColor: '#6366F1',
          }}
        />
      </div>

      {/* Footer stats */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 16px',
        background: '#151522', borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Fira Code', monospace" }}>
          {lineCount} lines · {code.length} chars
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'Fira Code', monospace" }}>
          Ctrl+Enter to run
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
