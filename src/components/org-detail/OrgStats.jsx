export default function OrgStats({ org }) {
  const stats = [
    { label: 'Projects', value: org.totalProjects, color: 'text-cyber-primary' },
    { label: 'Mentees', value: org.totalMentees, color: 'text-cyber-secondary' },
    { label: 'Terms Active', value: org.participations.length, color: 'text-cyber-fg' },
    { label: 'Years Active', value: org.yearsActive.length, color: 'text-cyber-fg' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-cyber-outline/20 bg-cyber-surface-low p-4 text-center shadow-inner hover:bg-cyber-surface-high transition-colors"
        >
          <div className={`text-3xl font-display font-bold ${stat.color}`}>
            {stat.value.toLocaleString()}
          </div>
          <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-cyber-fg-muted">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

