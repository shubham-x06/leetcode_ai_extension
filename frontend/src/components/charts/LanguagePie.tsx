import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '../ui/Card';

interface LanguagePieProps {
  data?: {
    languageName: string;
    problemsSolved: number;
  }[];
  delay?: number;
}

const COLORS = [
  'var(--accent)',
  'rgba(99, 102, 241, 0.8)',
  'rgba(99, 102, 241, 0.6)',
  'rgba(99, 102, 241, 0.4)',
  'rgba(99, 102, 241, 0.2)',
];

export function LanguagePie({ data = [], delay = 0 }: LanguagePieProps) {
  const totalSolved = data.reduce((sum, item) => sum + item.problemsSolved, 0);

  return (
    <Card delay={delay} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Languages Used</h3>
      
      <div style={{ flex: 1, position: 'relative', minHeight: 180 }}>
        {/* Total Centered in Donut */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalSolved}
          </div>
          <p className="label" style={{ fontSize: '9px' }}>Solved</p>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="problemsSolved"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '12px' }}
              itemStyle={{ color: 'var(--text-primary)' }}
              formatter={(value: any, name: any, props: any) => [
                `${value} problems`,
                props.payload?.languageName || name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginTop: 'var(--space-6)', justifyContent: 'center' }}>
        {data.slice(0, 5).map((item, index) => (
          <div key={item.languageName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.languageName}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.problemsSolved}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
