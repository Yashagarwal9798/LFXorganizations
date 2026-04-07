import ProjectCard from './ProjectCard';

export default function TermTimeline({ projects, participations }) {
  // Group projects by year, then by season
  const years = {};
  for (const p of projects) {
    if (!p.term) continue;
    const { year, season, label } = p.term;
    if (!years[year]) years[year] = {};
    if (!years[year][season]) years[year][season] = { label, projects: [] };
    years[year][season].projects.push(p);
  }

  const sortedYears = Object.keys(years)
    .map(Number)
    .sort((a, b) => b - a);

  const seasonOrder = ['spring', 'summer', 'fall'];

  if (projects.length === 0) {
      return <div className="text-cyber-fg-muted font-mono py-12 text-center border border-dashed border-cyber-outline/30 rounded-xl">No mentorship projects found.</div>;
  }

  return (
    <div className="space-y-12">
      {sortedYears.map((year) => (
        <div key={year} className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-cyber-outline/20 transform translate-y-8"></div>
          <h3 className="mb-6 text-2xl font-display font-medium text-cyber-fg flex items-center gap-4">
            <span className="w-8 h-8 rounded-full bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center text-cyber-primary text-sm shadow-[0_0_10px_rgba(0,209,255,0.2)] z-10 -ml-4">
               {year.toString().slice(-2)}
            </span>
            {year}
          </h3>

          {seasonOrder.map((season) => {
            const group = years[year]?.[season];
            if (!group) return null;

            return (
              <div key={`${year}-${season}`} className="mb-8 ml-8 relative">
                <div className="absolute -left-[37px] top-2 w-3 h-3 rounded-full bg-cyber-surface border-2 border-cyber-secondary z-10"></div>
                <h4 className="mb-4 text-base font-medium text-cyber-fg">
                  {group.label}
                  <span className="ml-3 font-mono text-xs text-cyber-fg-muted uppercase tracking-wider">
                    [{group.projects.length} project{group.projects.length !== 1 ? 's' : ''}]
                  </span>
                </h4>
                <div className="space-y-4">
                  {group.projects.map((project, idx) => (
                    <ProjectCard key={`${project.id}-${idx}`} project={project} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

