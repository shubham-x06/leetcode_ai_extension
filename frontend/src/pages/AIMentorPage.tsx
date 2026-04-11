import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDailyGoal, getRecommendation, analyzeCode } from '../api/ai';
import { DailyGoalCard } from '../components/ai/DailyGoalCard';
import { RecommendationCard } from '../components/ai/RecommendationCard';
import { AnalysisPanel } from '../components/ai/AnalysisPanel';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export default function AIMentorPage() {
  const [problemDesc, setProblemDesc] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const { data: dailyGoal, isLoading: goalLoading } = useQuery({
    queryKey: ['ai', 'daily-goal'],
    queryFn: getDailyGoal,
    staleTime: 3600000,
  });

  const { 
    data: recommendation, 
    isLoading: recLoading, 
    refetch: refreshRec 
  } = useQuery({
    queryKey: ['ai', 'recommendation'],
    queryFn: getRecommendation,
    staleTime: 600000,
  });

  const analysisMutation = useMutation({
    mutationFn: (data: { language: string; problemDescription: string; code: string }) => analyzeCode(data),
  });

  const handleAnalyze = () => {
    if (!problemDesc.trim() || !code.trim()) return;
    analysisMutation.mutate({ language, problemDescription: problemDesc, code });
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {/* 1. Daily Goal */}
      <DailyGoalCard 
        isLoading={goalLoading} 
        motivation={dailyGoal?.motivation} 
        problems={dailyGoal?.problems} 
      />

      {/* 2. Personalized Recommendation */}
      <RecommendationCard 
        isLoading={recLoading} 
        recommendation={recommendation} 
        onRefresh={refreshRec}
      />

      {/* 3. Analysis Panel */}
      <div id="analysis-section" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <h2 className="h2">Code Analysis & Tutoring</h2>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Language</p>
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  style={selectStyle}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="golang">Go</option>
                </select>
              </div>
            </div>

            <div>
              <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Problem Description / Title</p>
              <input 
                type="text" 
                placeholder="e.g. Two Sum"
                value={problemDesc}
                onChange={(e) => setProblemDesc(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Your Code</p>
              <textarea 
                placeholder="Paste your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ ...inputStyle, height: 200, fontFamily: 'var(--font-mono)', fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            <Button 
              size="lg" 
              onClick={handleAnalyze} 
              isLoading={analysisMutation.isPending}
              disabled={!problemDesc.trim() || !code.trim() || analysisMutation.isPending}
              style={{ width: '100%' }}
            >
              Analyze with LeetAI
            </Button>
          </div>
        </Card>

        {/* Results Section */}
        {(analysisMutation.data || analysisMutation.isPending) && (
          <AnalysisPanel 
            isLoading={analysisMutation.isPending} 
            analysis={analysisMutation.data} 
          />
        )}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '0 12px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 16px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};
