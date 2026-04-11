import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

type Row = { topic: string; strength: number };

export function SkillRadar({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return <p className="mt-2 text-sm text-[var(--muted)]">No skill buckets detected yet.</p>;
  }
  return (
    <div className="mt-2 h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="topic" />
          <Radar name="Strength" dataKey="strength" stroke="#7aa2f7" fill="#7aa2f7" fillOpacity={0.35} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
