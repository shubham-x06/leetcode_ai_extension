import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from '../ui/Card';

interface RatingLineProps {
  history?: {
    contest: { title: string; startTime: number };
    rating: number;
    ranking: number;
  }[];
  delay?: number;
}

export function RatingLine({ history = [], delay = 0 }: RatingLineProps) {
  const data = [...(history || [])]
    .sort((a, b) => (a?.contest?.startTime || 0) - (b?.contest?.startTime || 0))
    .map(c => ({
      name: c?.contest?.title || 'Unknown Contest',
      rating: Math.round(c?.rating || 0),
      rank: c?.ranking,
      date: c?.contest?.startTime ? new Date(c.contest.startTime * 1000).toLocaleDateString(undefined, { month: 'short', year: '2-digit' } as any) : 'N/A',
    }));

  return (
    <Card delay={delay} style={{ height: '100%', minHeight: 350, display: 'flex', flexDirection: 'column' }}>
      <h3 className="h3" style={{ marginBottom: 'var(--space-6)' }}>Rating History</h3>
      
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              domain={['dataMin - 100', 'dataMax + 100']} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '12px' }}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}
              itemStyle={{ color: 'var(--accent)', fontSize: '13px' }}
              formatter={(value: any) => [`${value}`, 'Rating']}
              labelFormatter={(label) => `${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="rating" 
              stroke="var(--accent)" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorRating)" 
              dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--text-primary)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
