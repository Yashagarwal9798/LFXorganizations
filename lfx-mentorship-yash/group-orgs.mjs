export function groupOrgs(projects) {
  const orgMap = new Map();

  for (const project of projects) {
    const { orgSlug } = project;
    if (!orgMap.has(orgSlug)) {
      orgMap.set(orgSlug, []);
    }
    orgMap.get(orgSlug).push(project);
  }

  const organizations = [];

  for (const [slug, orgProjects] of orgMap) {
    const sorted = [...orgProjects].sort((a, b) => {
      if (!a.term) return 1;
      if (!b.term) return -1;
      return new Date(b.term.startDate) - new Date(a.term.startDate);
    });

    const latest = sorted[0];

    // Collect all unique skills
    const skillSet = new Set();
    for (const p of orgProjects) {
      for (const s of p.skills) {
        skillSet.add(s);
      }
    }

    // Build participations grouped by term label
    const termMap = new Map();
    for (const p of orgProjects) {
      if (!p.term) continue;
      const key = p.term.label;
      if (!termMap.has(key)) {
        termMap.set(key, { term: p.term, projectCount: 0, projectIds: [] });
      }
      const entry = termMap.get(key);
      entry.projectCount++;
      entry.projectIds.push(p.id);
    }

    const participations = [...termMap.values()].sort((a, b) => {
      if (a.term.year !== b.term.year) return a.term.year - b.term.year;
      const order = { spring: 0, summer: 1, fall: 2 };
      return order[a.term.season] - order[b.term.season];
    });

    // Years active
    const yearsSet = new Set();
    for (const p of orgProjects) {
      if (p.term) yearsSet.add(p.term.year);
    }
    const yearsActive = [...yearsSet].sort((a, b) => a - b);

    // Count graduated mentees
    let totalMentees = 0;
    const seenMentees = new Set();
    for (const p of orgProjects) {
      for (const m of p.mentees) {
        if (m.status === 'graduated' && !seenMentees.has(m.id)) {
          seenMentees.add(m.id);
          totalMentees++;
        }
      }
    }

    // Track how this org was resolved (pick most common source)
    const sourceCounts = {};
    for (const p of orgProjects) {
      const s = p.orgSource || 'unknown';
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    }
    const primarySource = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    // Description: use latest project's description, trim to 300 chars
    let description = latest.description || '';
    if (description.length > 300) {
      description = description.substring(0, 297) + '...';
    }

    organizations.push({
      slug,
      name: latest.orgRawName,
      displayName: latest.displayName,
      foundation: latest.foundation,
      orgSource: primarySource,
      description,
      logoUrl: latest.logoUrl,
      websiteUrl: latest.websiteUrl,
      repoLink: latest.repoLink,
      color: latest.color,
      skills: [...skillSet],
      firstYear: yearsActive[0] || null,
      lastYear: yearsActive[yearsActive.length - 1] || null,
      totalProjects: orgProjects.length,
      totalMentees,
      participations,
      yearsActive,
    });
  }

  organizations.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`  ✓ Grouped into ${organizations.length} organizations`);
  return organizations;
}

export function buildMeta(organizations, projects) {
  const foundationSet = new Set();
  const yearSet = new Set();
  const skillSet = new Set();
  let totalMentees = 0;

  // Count resolution sources
  const sourceStats = {};
  for (const org of organizations) {
    foundationSet.add(org.foundation);
    totalMentees += org.totalMentees;
    for (const y of org.yearsActive) yearSet.add(y);
    for (const s of org.skills) skillSet.add(s);
    const src = org.orgSource || 'unknown';
    sourceStats[src] = (sourceStats[src] || 0) + 1;
  }

  return {
    foundations: [...foundationSet].sort(),
    years: [...yearSet].sort((a, b) => b - a),
    seasons: ['spring', 'summer', 'fall'],
    skills: [...skillSet].sort(),
    totalOrganizations: organizations.length,
    totalProjects: projects.length,
    totalMentees,
    sourceStats,  // NEW: breakdown of how orgs were resolved
    lastUpdated: new Date().toISOString(),
  };
}
