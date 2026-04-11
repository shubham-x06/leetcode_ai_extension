import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Analysis {
  timeComplexity?: string;
  spaceComplexity?: string;
  alternativeApproaches?: string[];
  topicReinforced?: string;
  improvementTips?: string[];
}

export function AnalysisPanel({ analysis, isLoading }: { analysis?: Analysis; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', animation: 'pageEnter 0.4s ease-out' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 100, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }} className="shimmer-base" />
        ))}
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'pageEnter 0.4s ease-out' }}>
      {/* 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
        <ResultCard 
          label="Time Complexity" 
          value={analysis.timeComplexity || 'O(N)'} 
          accent 
        />
        <ResultCard 
          label="Space Complexity" 
          value={analysis.spaceComplexity || 'O(1)'} 
          accent 
        />
        <ResultCard 
          label="Topic Reinforced" 
          content={<Badge variant="accent" style={{ marginTop: '4px' }}>{analysis.topicReinforced || 'Recursion'}</Badge>} 
        />
        <ResultCard 
          label="Optimization Tip" 
          content={
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
              {analysis.improvementTips?.[0] || 'Consider iterative approach to avoid stack overflow.'}
            </div>
          } 
        />
      </div>

      {/* Alternative Approaches */}
      {analysis.alternativeApproaches && analysis.alternativeApproaches.length > 0 && (
        <Card>
          <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Alternative Approaches</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {analysis.alternativeApproaches.map((alt, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  gap: 'var(--space-4)', 
                  paddingBottom: i === analysis.alternativeApproaches!.length - 1 ? 0 : 'var(--space-4)',
                  borderBottom: i === analysis.alternativeApproaches!.length - 1 ? 'none' : '1px solid var(--border-subtle)'
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{i + 1}.</span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alt}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ResultCard({ label, value, content, accent = false }: { label: string; value?: string; content?: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      borderLeft: accent ? '3px solid var(--accent)' : 'none'
    }}>
      <p className="label" style={{ fontSize: '10px', marginBottom: '4px' }}>{label}</p>
      {value ? (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {value}
        </div>
      ) : content}
    </div>
  );
}
