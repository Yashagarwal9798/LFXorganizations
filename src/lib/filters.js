export function filterOrgs(organizations, filters) {
  let result = [...organizations];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.displayName.toLowerCase().includes(q) ||
        org.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (filters.year) {
    const year = parseInt(filters.year);
    result = result.filter((org) => org.yearsActive.includes(year));
  }

  if (filters.season) {
    result = result.filter((org) =>
      org.participations.some((p) => p.term.season === filters.season)
    );
  }

  if (filters.foundation) {
    result = result.filter((org) => org.foundation === filters.foundation);
  }

  if (filters.skill) {
    const skill = filters.skill.toLowerCase();
    result = result.filter((org) =>
      org.skills.some((s) => s.toLowerCase() === skill)
    );
  }

  return result;
}

export function sortOrgs(organizations, sortBy) {
  const sorted = [...organizations];

  switch (sortBy) {
    case 'projects':
      return sorted.sort((a, b) => b.totalProjects - a.totalProjects);
    case 'mentees':
      return sorted.sort((a, b) => b.totalMentees - a.totalMentees);
    case 'recent':
      return sorted.sort((a, b) => (b.lastYear || 0) - (a.lastYear || 0));
    case 'alpha':
    default:
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}
