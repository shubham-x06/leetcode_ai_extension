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

  const lineCount = (code || '').split('\n').length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#0A0A14', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: 0,
    }}>
      {/* Editor header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: '#111120', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, gap: 'var(--space-3)',
      }}>
        {/* macOS dots + language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <select
            value={language}
            onChange={e => handleLangChange(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '3px 8px', color: '#E2E8F0', fontSize: 12,
              cursor: 'pointer', outline: 'none',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Reset */}
          <button
            onClick={() => onChange(LANGUAGE_STARTERS[language] || '')}
            style={{
              padding: '4px 10px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.4)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            Reset
          </button>

          {/* Run button */}
          <button
            onClick={onRun}
            disabled={isRunning || disabled || !code.trim()}
            title="Run code against test cases (Ctrl+Enter)"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 6,
              background: isRunning ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.2)',
              border: '1px solid rgba(16,185,129,0.3)',
              cursor: isRunning || disabled ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600, color: '#10B981',
              opacity: !code.trim() ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            {isRunning ? (
              <>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10B981',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Running...
              </>
            ) : (
              <>
                <svg width="10" height="12" viewBox="0 0 10 12" fill="#10B981">
                  <path d="M0 0L10 6L0 12V0Z"/>
                </svg>
                Run
              </>
            )}
          </button>

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting || disabled || !code.trim() || isSubmitted}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 6,
              background: isSubmitted
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(99,102,241,0.9)',
              border: isSubmitted ? '1px solid rgba(16,185,129,0.3)' : 'none',
              cursor: isSubmitting || disabled || !code.trim() || isSubmitted ? 'not-allowed' : 'pointer',
              fontSize: 12, fontWeight: 600,
              color: isSubmitted ? '#10B981' : '#fff',
              opacity: !code.trim() ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Submitting...
              </>
            ) : isSubmitted ? '✓ Submitted' : 'Submit →'}
          </button>
        </div>
      </div>

      {/* Code area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {/* Line numbers */}
        <div style={{
          flexShrink: 0, width: 40, padding: '14px 6px 14px 0',
          background: '#0A0A14',
          overflowY: 'hidden', userSelect: 'none',
          fontFamily: "'Fira Code', 'Cascadia Code', monospace",
          fontSize: 12, lineHeight: '22px',
          color: 'rgba(255,255,255,0.2)', textAlign: 'right',
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
            flex: 1, padding: '14px 16px',
            background: '#0A0A14',
            color: '#E2E8F0', border: 'none', outline: 'none', resize: 'none',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
            fontSize: 13, lineHeight: '22px', letterSpacing: '0.02em',
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
        padding: '5px 12px',
        background: '#111120', borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
          {lineCount} lines · {code.length} chars
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
          Ctrl+Enter to run
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
