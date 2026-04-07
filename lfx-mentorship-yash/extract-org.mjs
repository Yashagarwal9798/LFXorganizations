import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { resolveWithGemini } from './gemini-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const foundationMap = JSON.parse(
  readFileSync(join(__dirname, 'foundation-map.json'), 'utf-8')
);

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * TIER 1: Use lfProjectName — the most reliable source.
 * Returns { orgName, foundation } or null.
 */
function tier1_lfProjectName(raw) {
  const lfName = raw.lfProjectName;
  if (!lfName || lfName.trim() === '') return null;

  let orgName = lfName.trim();
  // Strip parenthetical suffixes like "(OMP)" from "Open Mainframe Project (OMP)"
  orgName = orgName.replace(/\s*\([^)]+\)\s*$/, '').trim();

  // Check if it maps to a known foundation
  let foundation = 'Linux Foundation';
  for (const [key, val] of Object.entries(foundationMap)) {
    if (orgName === key || orgName.startsWith(key)) {
      foundation = val.label;
      break;
    }
  }

  return { orgName, foundation, source: 'lfProjectName' };
}

/**
 * TIER 2: Parse raw.name using pattern matching.
 * 
 * KEY PRINCIPLE: Extract the SUB-PROJECT name as orgName, not the foundation.
 * "CNCF - Kyverno: Add feature X" → orgName="Kyverno", foundation="CNCF"
 * "Hyperledger - Fabric: Build SDK" → orgName="Fabric", foundation="Hyperledger"
 * "CNCF - CoreDNS: Improve caching" → orgName="CoreDNS", foundation="CNCF"
 */
function tier2_parseRawName(raw) {
  const name = (raw.name || '').trim();
  if (!name) return null;

  // Pattern A: "PREFIX - SubProject: Proposal Title"
  // e.g., "CNCF - Kyverno: Add feature X"
  const dashIdx = name.indexOf(' - ');
  if (dashIdx > 0) {
    const prefix = name.substring(0, dashIdx).trim();
    if (foundationMap[prefix]) {
      const remainder = name.substring(dashIdx + 3).trim();
      // Check if remainder has a colon (sub-project name)
      const colonIdx = remainder.indexOf(':');
      let orgName;
      if (colonIdx > 0) {
        // "Kyverno: Add feature X" → orgName = "Kyverno"
        orgName = remainder.substring(0, colonIdx).trim();
      } else {
        // "Some proposal title" with no colon → use full remainder
        // but strip trailing "(2025 Term 3)" type suffixes
        orgName = remainder.replace(/\s*\(\d{4}\s+Term\s+\d\)\s*$/, '').trim();
      }
      return {
        orgName,
        foundation: foundationMap[prefix].label,
        source: 'dash-prefix',
      };
    }
  }

  // Pattern B: "OrgName: Proposal Title" (where OrgName matches a foundation key)
  // e.g., "OpenSSF Scorecard: Improve docs" → orgName="OpenSSF Scorecard"
  const colonIdx = name.indexOf(':');
  if (colonIdx > 0) {
    const beforeColon = name.substring(0, colonIdx).trim();
    for (const [key, val] of Object.entries(foundationMap)) {
      if (beforeColon === key) {
        return {
          orgName: beforeColon,
          foundation: val.label,
          source: 'colon-prefix',
        };
      }
      // "OpenSSF Scorecard" starts with "OpenSSF" → orgName="OpenSSF Scorecard"
      if (beforeColon.startsWith(key + ' ')) {
        return {
          orgName: beforeColon,
          foundation: val.label,
          source: 'colon-prefix',
        };
      }
    }
  }

  // Pattern C: Name starts with a known foundation/project key
  // e.g., "CNCF CoreDNS improvement project" → orgName split
  for (const [key, val] of Object.entries(foundationMap)) {
    if (name.startsWith(key + ' - ')) {
      // Already handled by Pattern A
      continue;
    }
    if (name.startsWith(key + ':')) {
      return {
        orgName: key,
        foundation: val.label,
        source: 'startsWith',
      };
    }
    if (name.startsWith(key + ' ')) {
      // "CNCF CoreDNS improvement" → try to extract the next word as sub-project
      const rest = name.substring(key.length).trim();
      // Take everything before any colon or proposal description
      const restColonIdx = rest.indexOf(':');
      if (restColonIdx > 0) {
        return {
          orgName: rest.substring(0, restColonIdx).trim(),
          foundation: val.label,
          source: 'startsWith',
        };
      }
      // If no colon, this pattern is ambiguous - return the key as org
      return {
        orgName: key,
        foundation: val.label,
        source: 'startsWith',
      };
    }
    if (name === key) {
      return {
        orgName: key,
        foundation: val.label,
        source: 'startsWith',
      };
    }
  }

  return null;
}

/**
 * Extract org name for a single project using Tier 1 + Tier 2.
 * Returns the result or null if unresolved.
 */
function extractOrgLocal(raw) {
  // Tier 1 first
  const t1 = tier1_lfProjectName(raw);
  if (t1) return t1;

  // Tier 2 fallback
  const t2 = tier2_parseRawName(raw);
  if (t2) return t2;

  return null;
}

/**
 * Main extraction function — resolves all projects using 3 tiers.
 * @param {Array} rawProjects - raw API projects
 * @param {string} apiKey - Gemini API key
 * @param {string} model - Gemini model ID
 * @returns {Map<string, object>} projectId -> { orgName, foundation, source, displayName? }
 */
export async function extractAllOrgs(rawProjects, apiKey, model) {
  const orgResults = new Map();
  const unresolved = [];

  let tier1Count = 0;
  let tier2Count = 0;

  for (const raw of rawProjects) {
    const result = extractOrgLocal(raw);
    if (result) {
      orgResults.set(raw.projectId, result);
      if (result.source === 'lfProjectName') tier1Count++;
      else tier2Count++;
    } else {
      unresolved.push(raw);
    }
  }

  console.log(`    Tier 1 (lfProjectName): ${tier1Count} resolved`);
  console.log(`    Tier 2 (regex parsing): ${tier2Count} resolved`);
  console.log(`    Unresolved: ${unresolved.length} → sending to Gemini`);

  // Tier 3: Gemini for the rest
  if (unresolved.length > 0 && apiKey) {
    const geminiMap = await resolveWithGemini(unresolved, apiKey, model);

    for (const raw of unresolved) {
      const geminiOrg = geminiMap.get(raw.projectId);
      if (geminiOrg) {
        // Gemini returns sub-project names. Match to a known foundation.
        let foundation = 'Linux Foundation';
        for (const [key, val] of Object.entries(foundationMap)) {
          if (geminiOrg.includes(key)) {
            foundation = val.label;
            break;
          }
        }
        orgResults.set(raw.projectId, {
          orgName: geminiOrg,
          foundation,
          source: 'gemini',
        });
      } else {
        // Last resort: use project name (flagged)
        orgResults.set(raw.projectId, {
          orgName: raw.name || 'Unknown',
          foundation: 'Linux Foundation',
          source: 'fallback',
        });
      }
    }

    const geminiResolved = [...geminiMap.values()].length;
    const fallbacks = unresolved.length - geminiResolved;
    console.log(`    Tier 3 (Gemini AI): ${geminiResolved} resolved`);
    if (fallbacks > 0) console.log(`    ⚠ Fallback (unresolved): ${fallbacks}`);
  } else if (unresolved.length > 0) {
    console.log('    ⚠ No Gemini API key — using raw name as fallback for unresolved');
    for (const raw of unresolved) {
      orgResults.set(raw.projectId, {
        orgName: raw.name || 'Unknown',
        foundation: 'Linux Foundation',
        source: 'fallback',
      });
    }
  }

  return orgResults;
}

export { slugify, foundationMap };
