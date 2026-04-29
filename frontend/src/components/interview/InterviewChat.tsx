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
      borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minHeight: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px var(--space-5)', 
        background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 8px var(--success)',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          AI Interviewer
        </span>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {transcript.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar placeholder */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
                border: `1px solid ${msg.role === 'user' ? 'transparent' : 'var(--border-subtle)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
              }}>
                {msg.role === 'user' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: 12 }}>🤖</span>
                )}
              </div>
              
              <div style={{
                maxWidth: '85%', padding: '12px 16px',
                borderRadius: msg.role === 'user'
                  ? '20px 20px 4px 20px'
                  : '20px 20px 20px 4px',
                background: msg.role === 'user' ? 'linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)' : 'rgba(255,255,255,0.03)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
                fontSize: 14, lineHeight: 1.6,
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                backdropFilter: msg.role === 'user' ? 'none' : 'blur(8px)',
              }}>
                {msg.content}
              </div>
            </div>
            
            <span style={{ fontSize: 11, color: 'var(--text-muted)', margin: msg.role === 'user' ? '0 36px 0 0' : '0 0 0 36px' }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {isAiTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12 }}>🤖</span>
            </div>
            <div style={{
              padding: '12px 18px', borderRadius: '20px 20px 20px 4px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
              display: 'flex', gap: 6, alignItems: 'center',
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
        padding: '14px', borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}>
        <div style={{ 
          display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end',
          background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: '6px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s'
        }}>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Interview ended' : 'Type your message...'}
            rows={1}
            style={{
              flex: 1, padding: '8px 10px',
              background: 'transparent', border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14, lineHeight: 1.5, resize: 'none', outline: 'none',
              fontFamily: 'var(--font-sans)',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.6 : 1,
              minHeight: 38, maxHeight: 120,
            }}
          />
          <button
            onClick={onSend}
            disabled={disabled || !userInput.trim()}
            style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: disabled || !userInput.trim() ? 'rgba(255,255,255,0.05)' : 'var(--accent)',
              border: 'none', cursor: disabled || !userInput.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
              boxShadow: disabled || !userInput.trim() ? 'none' : '0 2px 8px rgba(99,102,241,0.4)',
            }}
            onMouseEnter={e => { if (!disabled && userInput.trim()) { e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { if (!disabled && userInput.trim()) { e.currentTarget.style.transform = 'translateY(0)'; } }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={disabled || !userInput.trim() ? 'var(--text-muted)' : '#fff'}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'var(--space-3)', paddingLeft: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Shift+Enter for new line</span>
          <span>Enter to send</span>
        </p>
      </div>
    </div>
  );
}
