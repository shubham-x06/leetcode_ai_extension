import React, { useState } from 'react';
import type { InterviewProblem } from '../../api/interview';

export function InterviewProblemPanel({ problem }: { problem: InterviewProblem }) {
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', minHeight: 0,
    }}>
      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          {problem.title}
        </h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {problem.topicTags.slice(0, 4).map(t => (
            <span key={t.name} style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}>{t.name}</span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
        <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
          {problem.content.split('\n').map((line, i) => (
            <p key={i} style={{
              marginBottom: line.trim() === '' ? 'var(--space-3)' : 'var(--space-1)',
              minHeight: line.trim() === '' ? 8 : 'auto',
            }}>
              {line || '\u00A0'}
            </p>
          ))}
        </div>

        {problem.hints && problem.hints.length > 0 && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <button
              onClick={() => setShowHints(!showHints)}
              style={{
                background: 'none', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: '6px 14px',
                cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {showHints ? 'Hide hints' : `Show hints (${problem.hints.length})`}
            </button>

            {showHints && (
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {problem.hints.slice(0, revealedHints).map((hint, i) => (
                  <div key={i} style={{
                    background: 'var(--warning-subtle)', border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-3)',
                    fontSize: 13, color: 'var(--text-secondary)',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--warning)', marginRight: 6 }}>Hint {i + 1}:</span>
                    {hint}
                  </div>
                ))}
                {revealedHints < problem.hints.length && (
                  <button
                    onClick={() => setRevealedHints(r => r + 1)}
                    style={{
                      alignSelf: 'flex-start', background: 'none',
                      border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-md)',
                      padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--warning)',
                    }}
                  >
                    Reveal next hint
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
