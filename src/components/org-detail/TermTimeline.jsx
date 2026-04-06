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

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Project Timeline
      </h2>

      {sortedYears.map((year) => (
        <div key={year}>
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            {year}
          </h3>

          {seasonOrder.map((season) => {
            const group = years[year]?.[season];
            if (!group) return null;

            return (
              <div key={`${year}-${season}`} className="mb-6 ml-4">
                <h4 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  {group.label}
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    ({group.projects.length} project{group.projects.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                <div className="space-y-2">
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
