import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getDb } from './mongodb';

/**
 * Load organizations with only the fields needed for the home page grid.
 * This keeps the serialized payload small (~100KB vs ~600KB).
 * Cached for 1 hour — data only changes weekly.
 */
export const loadOrganizations = unstable_cache(
  async () => {
    const db = await getDb();
    const organizations = await db.collection('organizations').find({}, {
      projection: {
        _id: 0,
        slug: 1,
        name: 1,
        displayName: 1,
        foundation: 1,
        description: 1,
        logoUrl: 1,
        color: 1,
        skills: 1,
        totalProjects: 1,
        totalMentees: 1,
        firstYear: 1,
        lastYear: 1,
        yearsActive: 1,
        'participations.term.label': 1,
        'participations.term.year': 1,
        'participations.term.season': 1,
        'participations.projectCount': 1,
      },
    }).sort({ name: 1 }).toArray();
    return { organizations, lastUpdated: new Date().toISOString() };
  },
  ['organizations-list'],
  { revalidate: 3600 }
);

/**
 * Load meta/aggregate stats.
 * Cached for 1 hour.
 */
export const loadMeta = unstable_cache(
  async () => {
    const db = await getDb();
    const meta = await db.collection('meta').findOne({});
    if (!meta) {
      return {
        foundations: [],
        years: [],
        seasons: ['spring', 'summer', 'fall'],
        skills: [],
        totalOrganizations: 0,
        totalProjects: 0,
        totalMentees: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    return {
      ...meta,
      _id: undefined,
    };
  },
  ['meta'],
  { revalidate: 3600 }
);

/**
 * Get a single org by slug.
 * Wrapped with React.cache() so duplicate calls within the same
 * server request (e.g. generateMetadata + page) are deduplicated.
 */
export const getOrgBySlug = cache(async (slug) => {
  const db = await getDb();
  const org = await db.collection('organizations').findOne({ slug });
  if (org) delete org._id;
  return org;
});

/**
 * Get all projects belonging to an org.
 */
export async function getProjectsByOrgSlug(orgSlug) {
  const db = await getDb();
  const projects = await db.collection('projects').find({ orgSlug }).toArray();
  return projects.map(p => { delete p._id; return p; });
}
