export function linkMentees(projects, rawMentees) {
  // Build a map of projectId → mentee list
  const projectMenteeMap = new Map();

  for (const mentee of rawMentees) {
    const menteeProjects = mentee.projects ?? [];
    const statuses = mentee.status ?? [];

    for (const mp of menteeProjects) {
      const projectId = mp.id;
      if (!projectId) continue;

      // Find the status for this project
      const statusEntry = statuses.find((s) => s.projectId === projectId);
      const status = statusEntry?.status || 'unknown';

      // Normalize status
      let normalizedStatus = 'unknown';
      if (status === 'graduated') normalizedStatus = 'graduated';
      else if (status === 'accepted' || status === 'published') normalizedStatus = 'accepted';
      else if (status === 'withdrawn') normalizedStatus = 'withdrawn';

      const menteeObj = {
        id: mentee.id,
        name: mentee.name,
        avatarUrl: mentee.avatarUrl || null,
        introduction: mentee.introduction || null,
        skills: mentee.skills ?? [],
        graduatedOn: mentee.graduatedOn
          ? new Date(mentee.graduatedOn * 1000).toISOString()
          : null,
        status: normalizedStatus,
      };

      if (!projectMenteeMap.has(projectId)) {
        projectMenteeMap.set(projectId, []);
      }
      projectMenteeMap.get(projectId).push(menteeObj);
    }
  }

  // Link mentees to projects
  let linked = 0;
  for (const project of projects) {
    const mentees = projectMenteeMap.get(project.id) ?? [];
    project.mentees = mentees;
    if (mentees.length > 0) linked++;
  }

  console.log(
    `  ✓ Linked mentees to ${linked} projects (${projectMenteeMap.size} projects had mentees)`
  );

  return projects;
}
