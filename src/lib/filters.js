/**
 * Filter organizations.
 * - Removed unnecessary initial array copy (each .filter() already creates a new array)
 * - Skills use a pre-built Set for O(1) lookups instead of nested .some()
 */
export function filterOrgs(organizations, filters) {
  let result = organizations;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.displayName.toLowerCase().includes(q)
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

  if (filters.skills && filters.skills.length > 0) {
    const wanted = filters.skills.map((s) => s.toLowerCase());
    result = result.filter((org) => {
      // Build a Set once per org for O(1) lookups
      const orgSkills = new Set((org.skills || []).map((s) => s.toLowerCase()));
      return wanted.every((skill) => orgSkills.has(skill));
    });
  }

  return result;
}

/**
 * Sort organizations.
 * filterOrgs already returns a new array, so we can sort in-place
 * instead of creating yet another copy.
 */
export function sortOrgs(organizations, sortBy) {
  switch (sortBy) {
    case 'projects':
      return organizations.sort((a, b) => b.totalProjects - a.totalProjects);
    case 'mentees':
      return organizations.sort((a, b) => b.totalMentees - a.totalMentees);
    case 'recent':
      return organizations.sort((a, b) => (b.lastYear || 0) - (a.lastYear || 0));
    case 'alpha':
    default:
      return organizations.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}
