'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FOUNDATION_COLORS } from '@/lib/constants';

export default function TermChart({ participations, foundation }) {
  if (!participations || participations.length === 0) return null;

  const data = participations.map((p) => ({
    name: p.term.label,
    projects: p.projectCount,
    mentees: p.term.menteeCount,
  }));

  const barColor = FOUNDATION_COLORS[foundation] || '#00D1FF';

  return (
    <div className="h-64 mt-4" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#7C8B9A', fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#7C8B9A', fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0, 209, 255, 0.05)' }}
            contentStyle={{
              backgroundColor: '#121722',
              border: '1px solid rgba(0, 209, 255, 0.2)',
              borderRadius: '8px',
              color: '#d4d4d8',
              fontSize: '12px',
              fontFamily: 'monospace',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            }}
            formatter={(value, name) => [value, name === 'projects' ? 'Projects' : 'Mentees']}
          />
          <Bar dataKey="projects" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

