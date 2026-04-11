import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface SkillRadarProps {
  skills?: {
    tagName: string;
    problemsSolved: number;
  }[];
  delay?: number;
}

export function SkillRadar({ skills = [], delay = 0 }: SkillRadarProps) {
  // Normalize and sort skills
  const data = (skills || [])
    .sort((a, b) => b.problemsSolved - a.problemsSolved)
    .slice(0, 6)
    .map(s => ({
      subject: s.tagName,
      A: s.problemsSolved,
      fullMark: Math.max(...skills.map(skill => skill.problemsSolved), 10),
    }));

  if (data.length < 3) {
    return (
      <Card delay={delay} style={{ height: '100%' }}>
        <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Skill Breakdown</h3>
        <EmptyState 
          title="Not enough data" 
          description="Keep solving problems across different topics to see your skill radar." 
        />
      </Card>
    );
  }

  return (
    <Card delay={delay} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Skill Breakdown</h3>
      
      <div style={{ flex: 1, minHeight: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="var(--border-subtle)" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
            />
            <Radar
              name="Solved"
              dataKey="A"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="var(--accent)"
              fillOpacity={0.15}
            />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '12px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
