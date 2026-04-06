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

  const barColor = FOUNDATION_COLORS[foundation] || '#3B82F6';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Projects per Term
      </h2>
      <div className="h-64" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#F9FAFB',
                fontSize: '13px',
              }}
              formatter={(value, name) => [value, name === 'projects' ? 'Projects' : 'Mentees']}
            />
            <Bar dataKey="projects" fill={barColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
