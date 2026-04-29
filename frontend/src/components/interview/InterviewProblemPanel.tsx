import React, { useState } from 'react';
import type { InterviewProblem } from '../../api/interview';

export function InterviewProblemPanel({ problem }: { problem: InterviewProblem }) {
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);

  return (
    <div style={{
      background: 'var(--bg-secondary)', 
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minHeight: 0,
      height: '100%',
    }}>
      <div style={{
        padding: 'var(--space-5)',
        borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-3)', letterSpacing: '-0.01em' }}>
          {problem.title}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {problem.topicTags.map(t => (
            <span key={t.name} style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)', backdropFilter: 'blur(4px)',
            }}>{t.name}</span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          {problem.content.split('\n').map((line, i) => (
            <p key={i} style={{
              marginBottom: line.trim() === '' ? 'var(--space-4)' : 'var(--space-2)',
              minHeight: line.trim() === '' ? 12 : 'auto',
            }}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>

        {/* Test Cases */}
        {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
          <div style={{ marginTop: 'var(--space-8)' }}>
            <h4 style={{ 
              fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', 
              marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 8 
            }}>
              <div style={{ width: 4, height: 14, background: 'var(--accent)', borderRadius: 2 }} />
              Sample Test Cases
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {problem.sampleTestCases.map((tc, i) => (
                <div key={i} style={{
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                   <div style={{ 
                     padding: '8px 12px', background: 'rgba(255,255,255,0.02)', 
                     borderBottom: '1px solid var(--border-subtle)', 
                     fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' 
                   }}>
                     Test Case {i + 1}
                   </div>
                   <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                     <div>
                       <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Input</span>
                       <code style={{ 
                         fontSize: 13, color: 'var(--text-primary)', fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                         background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, display: 'block',
                         border: '1px solid rgba(255,255,255,0.05)'
                       }}>{tc.input}</code>
                     </div>
                     <div>
                       <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Expected Output</span>
                       <code style={{ 
                         fontSize: 13, color: 'var(--success)', fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                         background: 'rgba(16,185,129,0.05)', padding: '8px 12px', borderRadius: 6, display: 'block',
                         border: '1px solid rgba(16,185,129,0.1)'
                       }}>{tc.expected}</code>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px dashed var(--border-subtle)' }}>
            <button
              onClick={() => setShowHints(!showHints)}
              style={{
                background: showHints ? 'var(--bg-tertiary)' : 'transparent', 
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: '8px 16px',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', gap: 8
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              {showHints ? 'Hide Hints' : `Show Hints (${problem.hints.length})`}
            </button>

            {showHints && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {problem.hints.slice(0, revealedHints).map((hint, i) => (
                  <div key={i} style={{
                    background: 'var(--warning-subtle)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Hint {i + 1}</div>
                    {hint}
                  </div>
                ))}
                {revealedHints < problem.hints.length && (
                  <button
                    onClick={() => setRevealedHints(r => r + 1)}
                    style={{
                      alignSelf: 'flex-start', background: 'transparent',
                      border: '1px dashed var(--warning)', borderRadius: 'var(--radius-md)',
                      padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--warning)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--warning-subtle)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    + Reveal Next Hint
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
