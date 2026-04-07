import { slugify } from './extract-org.mjs';

function getSeason(month) {
  if (month >= 1 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'fall';
}

function getSeasonLabel(season) {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

function buildTermRef(programTerm) {
  const startDate = new Date(programTerm.startDateTime * 1000);
  const endDate = new Date(programTerm.endDateTime * 1000);
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;
  const season = getSeason(month);

  const now = Date.now();
  let status = 'unknown';
  if (endDate.getTime() < now) {
    status = 'complete';
  } else if (startDate.getTime() <= now && endDate.getTime() >= now) {
    status = 'ongoing';
  } else if (programTerm.active === 'open') {
    status = 'accepting-applications';
  }

  return {
    id: programTerm.id,
    year,
    season,
    label: `${getSeasonLabel(season)} ${year}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status,
    menteeCount: programTerm.activeUsers || 0,
  };
}

const MIN_YEAR = 2021;

/**
 * Transform raw projects using the pre-resolved org map.
 * @param {Array} rawProjects - raw API data
 * @param {Map} orgMap - projectId -> { orgName, foundation, source, displayName? }
 * @param {Array} unmatchedLog - collects unmatched names
 */
export function transform(rawProjects, orgMap, unmatchedLog = []) {
  const results = [];

  for (const raw of rawProjects) {
    if (raw.status !== 'Published') continue;

    const orgInfo = orgMap.get(raw.projectId);
    if (!orgInfo) {
      unmatchedLog.push(raw.name);
      continue;
    }

    const orgRawName = orgInfo.orgName;
    const orgSlug = slugify(orgRawName);
    const displayName = orgInfo.displayName || orgRawName;
    const foundation = orgInfo.foundation || 'Linux Foundation';
    const orgSource = orgInfo.source || 'unknown';

    // Extract proposal title from raw.name
    let proposalTitle = raw.name || '';
    // Try to strip org prefix from the title
    const dashIdx = proposalTitle.indexOf(' - ');
    if (dashIdx > 0) {
      proposalTitle = proposalTitle.substring(dashIdx + 3).trim();
    }
    const colonIdx = proposalTitle.indexOf(':');
    if (colonIdx > 0) {
      proposalTitle = proposalTitle.substring(colonIdx + 1).trim();
    }
    // Remove trailing term info like "(2025 Term 3)"
    proposalTitle = proposalTitle.replace(/\s*\(\d{4}\s+Term\s+\d\)\s*$/, '').trim();

    if (!orgSlug) {
      unmatchedLog.push(raw.name);
      continue;
    }

    const skills = raw.apprenticeNeeds?.skills ?? [];
    const mentors = (raw.apprenticeNeeds?.mentors ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.logoUrl || null,
      introduction: m.introduction || null,
    }));

    const terms = raw.programTerms ?? [];
    if (terms.length === 0) continue;

    for (const pt of terms) {
      const termYear = new Date(pt.startDateTime * 1000).getFullYear();
      if (termYear < MIN_YEAR) continue;

      const term = buildTermRef(pt);
      results.push({
        id: raw.projectId,
        slug: raw.slug || slugify(raw.name),
        orgSlug,
        orgRawName,
        displayName,
        foundation,
        orgSource,  // NEW: track how the org was resolved
        title: proposalTitle,
        fullName: raw.name,
        description: raw.description || '',
        skills,
        mentors,
        mentees: [],
        term,
        repoLink: raw.repoLink || null,
        websiteUrl: raw.websiteUrl || null,
        logoUrl: raw.logoUrl || null,
        color: raw.color || null,
      });
    }
  }

  return results;
}
