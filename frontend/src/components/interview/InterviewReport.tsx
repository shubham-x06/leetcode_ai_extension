import React from 'react';
import type { FeedbackReport, InterviewProblem } from '../../api/interview';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Props {
  report: FeedbackReport;
  problems: InterviewProblem[];
  onStartNew: () => void;
}

const VERDICT_COLOR: Record<string, string> = {
  'Strong Hire': 'var(--success)',
  'Hire': 'var(--accent)',
  'No Hire': 'var(--warning)',
  'Strong No Hire': 'var(--error)',
};

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);
  const color = score >= 8 ? 'var(--success)' : score >= 6 ? 'var(--accent)' : score >= 4 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 'var(--radius-full)',
        background: 'var(--bg-tertiary)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 'var(--radius-full)',
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>
        {score}/10
      </span>
    </div>
  );
}

export function InterviewReport({ report, problems, onStartNew }: Props) {
  const verdictColor = VERDICT_COLOR[report.overallVerdict] || 'var(--text-primary)';
  const scoreLabels: Record<string, string> = {
    problemSolving: 'Problem Solving',
    codeQuality: 'Code Quality',
    optimization: 'Optimization',
    communication: 'Communication',
    edgeCases: 'Edge Cases',
    timeManagement: 'Time Management',
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 'var(--space-6)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 80, height: 80, borderRadius: '50%', marginBottom: 'var(--space-5)',
          background: `${verdictColor}20`, border: `2px solid ${verdictColor}40`,
          fontSize: 36,
        }}>
          {report.overallScore >= 8 ? '🏆' : report.overallScore >= 6 ? '💪' : report.overallScore >= 4 ? '📈' : '🎯'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)',
          marginBottom: 'var(--space-3)',
        }}>
          Interview Complete
        </h1>
        <div style={{
          display: 'inline-block', padding: '6px 20px', borderRadius: 'var(--radius-full)',
          background: `${verdictColor}15`, border: `1px solid ${verdictColor}30`,
          fontSize: 15, fontWeight: 700, color: verdictColor, marginBottom: 'var(--space-4)',
        }}>
          {report.overallVerdict}
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
          {report.summary}
        </p>
      </div>

      {/* Overall score */}
      <Card variant="accent">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          <h3 className="h3">Performance Scores</h3>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', color: verdictColor }}>
              {report.overallScore}/10
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>overall score</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {Object.entries(report.scores).map(([key, val]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {scoreLabels[key] || key}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: '60%', textAlign: 'right' }}>
                  {val.comment}
                </span>
              </div>
              <ScoreBar score={val.score} />
            </div>
          ))}
        </div>
      </Card>

      {/* Strengths and improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
        <Card>
          <h3 className="h3" style={{ color: 'var(--success)', marginBottom: 'var(--space-5)' }}>
            ✓ Strengths
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {report.strengths.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start',
                padding: 'var(--space-3)', background: 'var(--success-subtle)',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>+</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="h3" style={{ color: 'var(--error)', marginBottom: 'var(--space-5)' }}>
            ↑ Areas to Improve
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {report.improvements.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start',
                padding: 'var(--space-3)', background: 'var(--error-subtle)',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <span style={{ color: 'var(--error)', fontWeight: 700, flexShrink: 0 }}>!</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Per-problem feedback */}
      {report.problemFeedback.map((pf, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <h3 className="h3">Problem {i + 1}: {pf.problemTitle}</h3>
            <Badge variant={pf.solved ? 'success' : 'error'}>
              {pf.solved ? 'Solved' : 'Incomplete'}
            </Badge>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[
              { label: 'Your Approach', value: pf.approach },
              { label: 'Optimal Approach', value: pf.optimalApproach },
              { label: 'Complexity Achieved', value: pf.complexityAchieved },
              { label: 'Optimal Complexity', value: pf.complexityOptimal },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
              }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item.value}</p>
              </div>
            ))}
          </div>
          {pf.missedEdgeCases.length > 0 && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Missed Edge Cases
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {pf.missedEdgeCases.map((ec, j) => (
                  <span key={j} style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--warning-subtle)', color: 'var(--warning)',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}>{ec}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* Recommended topics + next steps */}
      <Card>
        <h3 className="h3" style={{ marginBottom: 'var(--space-5)' }}>Study Recommendations</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
          {report.recommendedTopics.map((t, i) => (
            <span key={i} style={{
              fontSize: 13, padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-subtle)', color: 'var(--accent)',
              border: '1px solid var(--border-accent)', fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
        <div style={{
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-5)', borderLeft: '3px solid var(--accent)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
            Next Steps
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {report.nextSteps}
          </p>
        </div>
      </Card>

      {/* CTA */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
        <button
          onClick={onStartNew}
          style={{
            padding: '14px 40px', borderRadius: 'var(--radius-lg)',
            background: 'var(--accent)', border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 600, color: '#fff',
            boxShadow: 'var(--shadow-accent)',
            transition: 'transform var(--transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}
