import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface SolvedRingsProps {
  stats?: {
    totalSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    totalEasy?: number;
    totalMedium?: number;
    totalHard?: number;
  };
  delay?: number;
}

export function SolvedRings({ stats, delay = 0 }: SolvedRingsProps) {
  const solved = [
    { label: 'Easy',   value: stats?.easySolved || 0,   total: stats?.totalEasy || 100, color: 'var(--easy)',   subtle: 'var(--easy-subtle)' },
    { label: 'Medium', value: stats?.mediumSolved || 0, total: stats?.totalMedium || 100, color: 'var(--medium)', subtle: 'var(--medium-subtle)' },
    { label: 'Hard',   value: stats?.hardSolved || 0,   total: stats?.totalHard || 100, color: 'var(--hard)',   subtle: 'var(--hard-subtle)' },
  ];

  const totalSolved = stats?.totalSolved || 0;

  return (
    <Card delay={delay} style={{ height: '100%' }}>
      <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Problems Solved</h3>
      
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Total Centered */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="display gradient-text" style={{ fontSize: '48px', marginBottom: '2px' }}>
            {totalSolved}
          </div>
          <p className="label">Total Solved</p>
        </div>

        {/* Rings Row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', gap: 'var(--space-2)' }}>
          {solved.map((item, idx) => (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: 80, height: 80, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { value: item.value },
                        { value: Math.max(0, item.total - item.value) }
                      ]}
                      innerRadius={30}
                      outerRadius={38}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={item.color} />
                      <Cell fill={item.subtle} stroke={item.subtle} strokeWidth={1} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Percentage Center */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  opacity: 0.9
                }}>
                  {item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%
                </div>
              </div>
              <div style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '20px', 
                fontWeight: 600, 
                color: item.color,
                marginTop: 'var(--space-2)' 
              }}>
                {item.value}
              </div>
              <p className="caption" style={{ fontSize: '11px' }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
