import { getDb } from './mongodb';

/**
 * Load organizations with only the fields needed for the home page grid.
 * This keeps the serialized payload small (~100KB vs ~600KB).
 */
export async function loadOrganizations() {
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
}

export async function loadProjects() {
  const db = await getDb();
  const projects = await db.collection('projects').find({}).toArray();
  return { projects, lastUpdated: new Date().toISOString() };
}

export async function loadMeta() {
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
}

export async function getOrgBySlug(slug) {
  const db = await getDb();
  const org = await db.collection('organizations').findOne({ slug });
  if (org) delete org._id;
  return org;
}

export async function getProjectsByOrgSlug(orgSlug) {
  const db = await getDb();
  const projects = await db.collection('projects').find({ orgSlug }).toArray();
  return projects.map(p => { delete p._id; return p; });
}
