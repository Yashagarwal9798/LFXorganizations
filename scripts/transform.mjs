import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const foundationMap = JSON.parse(
  readFileSync(join(__dirname, 'foundation-map.json'), 'utf-8')
);

function getSeason(month) {
  if (month >= 1 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'fall';
}

function getSeasonLabel(season) {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseOrgName(fullName) {
  // Try to split on first ":" to separate org from proposal title
  const colonIdx = fullName.indexOf(':');
  let orgRawName, proposalTitle;

  if (colonIdx > 0) {
    orgRawName = fullName.substring(0, colonIdx).trim();
    proposalTitle = fullName.substring(colonIdx + 1).trim();
    // Remove trailing term info like "(2025 Term 3)" from proposal title
    proposalTitle = proposalTitle.replace(/\s*\(\d{4}\s+Term\s+\d\)\s*$/, '').trim();
  } else {
    orgRawName = fullName.trim();
    proposalTitle = fullName.trim();
  }

  // Extract foundation prefix: look for "Foundation - OrgName" pattern
  let foundation = 'Linux Foundation';
  let displayName = orgRawName;

  const dashIdx = orgRawName.indexOf(' - ');
  if (dashIdx > 0) {
    const prefix = orgRawName.substring(0, dashIdx).trim();
    if (foundationMap[prefix]) {
      foundation = foundationMap[prefix].label;
      displayName = orgRawName.substring(dashIdx + 3).trim();
    }
  } else {
    // Check if the whole name matches a known foundation/org
    for (const [key, val] of Object.entries(foundationMap)) {
      if (orgRawName.startsWith(key)) {
        foundation = val.label;
        // displayName stays as orgRawName
        break;
      }
    }
  }

  return {
    orgRawName,
    orgSlug: slugify(orgRawName),
    displayName,
    foundation,
    proposalTitle,
  };
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

// Only include data from this year onward
const MIN_YEAR = 2021;

export function transform(rawProjects, unmatchedLog = []) {
  const results = [];

  for (const raw of rawProjects) {
    if (raw.status !== 'Published') continue;

    const { orgRawName, orgSlug, displayName, foundation, proposalTitle } =
      parseOrgName(raw.name || '');

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

    // Skip projects with no terms (old/archived)
    if (terms.length === 0) continue;

    // Only keep terms from 2021 onward
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
