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
      }}>
        <Spinner size="md" />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Analyzing your code against test cases...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 'var(--space-12)', gap: 'var(--space-3)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>▷</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Click "Run" to test your code against sample cases
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: result.allPassed ? 'var(--success-subtle)' : 'var(--error-subtle)',
        border: `1px solid ${result.allPassed ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        borderRadius: 'var(--radius-md)',
      }}>
        <span style={{
          fontSize: 14, fontWeight: 700,
          color: result.allPassed ? 'var(--success)' : 'var(--error)',
        }}>
          {result.allPassed
            ? '✓ All tests passed'
            : `${result.results.filter(r => r.passed).length}/${result.results.length} tests passed`}
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Time: <strong style={{ color: 'var(--text-primary)' }}>{result.timeComplexity}</strong>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Space: <strong style={{ color: 'var(--text-primary)' }}>{result.spaceComplexity}</strong>
          </span>
        </div>
      </div>

      {/* Individual test cases */}
      {result.results.map((tc, i) => (
        <div key={i} style={{
          border: `1px solid ${tc.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Test case header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            background: tc.passed ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Test Case {tc.testCase}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {tc.executionTime && tc.executionTime !== 'N/A' && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tc.executionTime}</span>
              )}
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: tc.passed ? 'var(--success-subtle)' : 'var(--error-subtle)',
                color: tc.passed ? 'var(--success)' : 'var(--error)',
              }}>
                {tc.passed ? 'Pass' : 'Fail'}
              </span>
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Input', value: tc.input },
              { label: 'Expected', value: tc.expected },
              { label: 'Your Output', value: tc.error || tc.actual },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, minWidth: 80 }}>
                  {item.label}:
                </span>
                <code style={{
                  color: item.label === 'Your Output' && !tc.passed ? 'var(--error)' : 'var(--text-primary)',
                  fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all',
                }}>
                  {item.value}
                </code>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary text */}
      {result.summary && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
          {result.summary}
        </p>
      )}
    </div>
  );
}
