import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface CalendarHeatmapProps {
  data?: {
    submissionCalendar?: string; // JSON string of { timestamp: count }
    streak?: number;
    longestStreak?: number;
    totalActiveDays?: number;
  };
  delay?: number;
}

export function CalendarHeatmap({ data, delay = 0 }: CalendarHeatmapProps) {
  // Build a map keyed by YYYY-MM-DD (local date) for reliable matching
  // LeetCode stores epoch timestamps as keys; they won't match midnight values exactly
  const submissionMap = useMemo(() => {
    if (!data?.submissionCalendar) return {} as Record<string, number>;
    try {
      const raw: Record<string, number> = typeof data.submissionCalendar === 'string'
        ? JSON.parse(data.submissionCalendar)
        : data.submissionCalendar;
      const byDate: Record<string, number> = {};
      for (const [ts, count] of Object.entries(raw)) {
        const d = new Date(Number(ts) * 1000);
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
        byDate[key] = (byDate[key] || 0) + count;
      }
      return byDate;
    } catch {
      return {} as Record<string, number>;
    }
  }, [data?.submissionCalendar]);

  // Generate last 365 days of data
  const { weeks, monthLabels } = useMemo(() => {
    const now = new Date();
    const resultWeeks = [];
    const labels: { label: string; index: number }[] = [];
    let currentWeek: (any | null)[] = [];
    
    // Start from 52 weeks ago (Sunday)
    const startDate = new Date();
    startDate.setDate(now.getDate() - (52 * 7));
    // Adjust to nearest Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const currentDate = new Date(startDate);
    let lastMonth = -1;

    for (let i = 0; i < 53 * 7; i++) {
      const timestamp = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD key
      const count = submissionMap[timestamp] || 0;
      
      const dayData = {
        date: new Date(currentDate),
        count,
        color: getBackgroundColor(count)
      };

      currentWeek.push(dayData);

      if (currentDate.getDay() === 6) {
        resultWeeks.push(currentWeek);
        currentWeek = [];
      }

      // Month label
      if (currentDate.getMonth() !== lastMonth && currentDate.getDate() <= 7) {
        labels.push({
          label: currentDate.toLocaleString('default', { month: 'short' }),
          index: resultWeeks.length
        });
        lastMonth = currentDate.getMonth();
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { weeks: resultWeeks, monthLabels: labels };
  }, [submissionMap]);

  function getBackgroundColor(count: number) {
    if (count === 0) return 'var(--bg-tertiary)';
    if (count <= 2) return 'rgba(99, 102, 241, 0.25)';
    if (count <= 5) return 'rgba(99, 102, 241, 0.50)';
    if (count <= 9) return 'rgba(99, 102, 241, 0.75)';
    return 'var(--accent)';
  }

  return (
    <Card delay={delay} className="w-full overflow-hidden">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h3 className="h3">Submission Activity</h3>
        <Badge variant="warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontWeight: 600 }}>
          🔥 {data?.streak || 0} day streak
        </Badge>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: 'var(--space-4)' }}>
        {/* Day Labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '18px', paddingRight: '4px' }}>
          {['Mon', 'Wed', 'Fri'].map(day => (
            <div key={day} className="caption" style={{ height: 11, fontSize: '9px', lineHeight: '11px', display: 'flex', alignItems: 'center' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div style={{ flex: 1 }}>
          {/* Month Labels */}
          <div style={{ display: 'flex', height: 18, position: 'relative' }}>
            {monthLabels.map((ml, i) => (
              <div key={i} className="caption" style={{ position: 'absolute', left: ml.index * 13, fontSize: '10px' }}>
                {ml.label}
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '2px' }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    title={`${day.date.toDateString()}: ${day.count} submissions`}
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: '2px',
                      background: day.color,
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
        <div>
          <p className="label" style={{ fontSize: '9px' }}>Total Active Days</p>
          <p className="h3" style={{ fontSize: '16px' }}>{data?.totalActiveDays || 0}</p>
        </div>
        <div>
          <p className="label" style={{ fontSize: '9px' }}>Longest Streak</p>
          <p className="h3" style={{ fontSize: '16px' }}>{data?.longestStreak || 0} days</p>
        </div>
      </div>
    </Card>
  );
}
