import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

function validate(organizations, projects, meta) {
  if (!organizations.length) throw new Error('No organizations generated');
  if (!projects.length) throw new Error('No projects generated');

  for (const org of organizations) {
    if (!org.slug) throw new Error(`Organization missing slug: ${org.name}`);
    if (!org.name) throw new Error(`Organization missing name`);
  }

  console.log(`  ✓ Validation passed`);
}

// Write to local JSON files (fallback / static export)
export function writeDataToFiles(organizations, projects, meta) {
  validate(organizations, projects, meta);

  mkdirSync(DATA_DIR, { recursive: true });

  const orgData = { organizations, lastUpdated: new Date().toISOString() };
  const projData = { projects, lastUpdated: new Date().toISOString() };

  writeFileSync(join(DATA_DIR, 'organizations.json'), JSON.stringify(orgData, null, 2));
  writeFileSync(join(DATA_DIR, 'projects.json'), JSON.stringify(projData, null, 2));
  writeFileSync(join(DATA_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log(`  ✓ Wrote 3 JSON files to public/data/`);
}

// Write to MongoDB
export async function writeDataToMongo(organizations, projects, meta, mongoUri) {
  validate(organizations, projects, meta);

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('lfx-mentorship');

    // Clear old data and insert fresh
    await db.collection('organizations').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('meta').deleteMany({});

    if (organizations.length > 0) {
      await db.collection('organizations').insertMany(organizations);
    }
    if (projects.length > 0) {
      // Insert in batches of 1000 to avoid hitting limits
      for (let i = 0; i < projects.length; i += 1000) {
        const batch = projects.slice(i, i + 1000);
        await db.collection('projects').insertMany(batch);
      }
    }
    await db.collection('meta').insertOne(meta);

    // Create indexes for fast lookups
    await db.collection('organizations').createIndex({ slug: 1 }, { unique: true });
    await db.collection('projects').createIndex({ orgSlug: 1 });

    console.log(`  ✓ Wrote to MongoDB:`);
    console.log(`    - organizations: ${organizations.length} docs`);
    console.log(`    - projects: ${projects.length} docs`);
    console.log(`    - meta: 1 doc`);
  } finally {
    await client.close();
  }
}
