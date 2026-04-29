import React from 'react';
import type { RunResult } from '../../api/interview';
import { Spinner } from '../ui/Spinner';

interface Props {
  result: RunResult | null;
  isLoading: boolean;
}

export function TestResultsPanel({ result, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)',
        height: '100%',
      }}>
        <Spinner size="md" />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Running code against test cases...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-4)',
        height: '100%',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
            No Results Yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Click "Run" to test your code against sample cases
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        background: result.allPassed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
        border: `1px solid ${result.allPassed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: result.allPassed ? '0 0 16px rgba(16,185,129,0.1)' : '0 0 16px rgba(239,68,68,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: result.allPassed ? 'var(--success)' : 'var(--error)',
            boxShadow: `0 0 8px ${result.allPassed ? 'var(--success)' : 'var(--error)'}`
          }} />
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: result.allPassed ? 'var(--success)' : 'var(--error)',
            letterSpacing: '-0.01em'
          }}>
            {result.allPassed
              ? 'All tests passed'
              : `${result.results.filter(r => r.passed).length}/${result.results.length} tests passed`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Time: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{result.timeComplexity}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Space: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{result.spaceComplexity}</strong>
          </span>
        </div>
      </div>

      {/* Summary text */}
      {result.summary && (
        <div style={{ 
          padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          borderLeft: '3px solid var(--accent)', fontSize: 13, color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          {result.summary}
        </div>
      )}

      {/* Individual test cases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {result.results.map((tc, i) => (
          <div key={i} style={{
            border: `1px solid ${tc.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: 'var(--bg-secondary)',
          }}>
            {/* Test case header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: tc.passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
              borderBottom: `1px solid ${tc.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Test Case {tc.testCase}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {tc.executionTime && tc.executionTime !== 'N/A' && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tc.executionTime}</span>
                )}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderRadius: 'var(--radius-full)',
                  background: tc.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: tc.passed ? 'var(--success)' : 'var(--error)',
                  border: `1px solid ${tc.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {tc.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Input</span>
                  <code style={{
                    color: 'var(--text-primary)', fontFamily: "'Fira Code', 'JetBrains Mono', monospace", fontSize: 13, 
                    background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, display: 'block',
                    border: '1px solid rgba(255,255,255,0.05)', wordBreak: 'break-all'
                  }}>
                    {tc.input}
                  </code>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Expected Output</span>
                  <code style={{
                    color: 'var(--success)', fontFamily: "'Fira Code', 'JetBrains Mono', monospace", fontSize: 13, 
                    background: 'rgba(16,185,129,0.05)', padding: '8px 12px', borderRadius: 6, display: 'block',
                    border: '1px solid rgba(16,185,129,0.1)', wordBreak: 'break-all'
                  }}>
                    {tc.expected}
                  </code>
                </div>
              </div>
              
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Your Output</span>
                <code style={{
                  color: tc.passed ? 'var(--text-primary)' : 'var(--error)', 
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace", fontSize: 13, 
                  background: tc.passed ? 'rgba(0,0,0,0.3)' : 'rgba(239,68,68,0.05)', 
                  padding: '8px 12px', borderRadius: 6, display: 'block',
                  border: `1px solid ${tc.passed ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.2)'}`,
                  wordBreak: 'break-all', whiteSpace: 'pre-wrap'
                }}>
                  {tc.error || tc.actual}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
