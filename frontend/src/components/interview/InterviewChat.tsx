import React from 'react';
import type { ChatMessage } from '../../api/interview';

interface Props {
  transcript: ChatMessage[];
  isAiTyping: boolean;
  userInput: string;
  setUserInput: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function InterviewChat({
  transcript, isAiTyping, userInput, setUserInput, onSend, disabled, chatEndRef,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minHeight: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px var(--space-4)', borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 6px var(--success)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          AI Interviewer
        </span>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {transcript.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 4,
          }}>
            <div style={{
              maxWidth: '88%', padding: '10px 14px',
              borderRadius: msg.role === 'user'
                ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              fontSize: 13, lineHeight: 1.6,
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {msg.role === 'user' ? 'You' : 'Interviewer'} · {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {isAiTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            <div style={{
              padding: '10px 16px', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)',
                  animation: `bounce 1s ease-in-out ${delay}s infinite`,
                }} />
              ))}
              <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Interview ended' : 'Type your response... (Enter to send)'}
            rows={2}
            style={{
              flex: 1, padding: '10px 12px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
              fontSize: 13, lineHeight: 1.5, resize: 'none', outline: 'none',
              fontFamily: 'var(--font-sans)',
              transition: 'border-color var(--transition-fast)',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          />
          <button
            onClick={onSend}
            disabled={disabled || !userInput.trim()}
            style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: disabled || !userInput.trim() ? 'var(--bg-elevated)' : 'var(--accent)',
              border: 'none', cursor: disabled || !userInput.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition-fast)', flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={disabled || !userInput.trim() ? 'var(--text-muted)' : '#fff'}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-2)', paddingLeft: 2 }}>
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
