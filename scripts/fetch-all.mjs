import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { transform } from './transform.mjs';
import { groupOrgs, buildMeta } from './group-orgs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
  const envPath = join(__dirname, '..', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {}

const BASE = 'https://api.mentorship.lfx.linuxfoundation.org';

/**
 * Fetch all projects from /projects/cache/paginate (offset-based).
 */
async function fetchAllProjects() {
  const results = [];
  let from = 0;
  let total = Infinity;

  while (from < total) {
    const url = `${BASE}/projects/cache/paginate?from=${from}&size=100&sortby=projectStatus&order=asc`;
    console.log(`    Fetching projects ${from + 1}–${from + 100}...`);

    let data;
    for (let retry = 0; retry < 3; retry++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        break;
      } catch (err) {
        if (retry === 2) throw err;
        console.log(`    Retry ${retry + 1}/3...`);
        await new Promise(r => setTimeout(r, 3000 * (retry + 1)));
      }
    }

    total = data.hits.total.value;
    const hits = data.hits.hits || [];
    results.push(...hits.map(h => h._source));
    console.log(`    ✓ +${hits.length} (total: ${results.length}/${total})`);

    from += 100;
    await new Promise(r => setTimeout(r, 200));
  }

  return results;
}

/**
 * Upsert documents into MongoDB — idempotent, no duplicates.
 */
async function upsertBatch(collection, items, uniqueKey) {
  if (items.length === 0) return { upserted: 0, modified: 0 };

  let totalUpserted = 0;
  let totalModified = 0;

  for (let i = 0; i < items.length; i += 500) {
    const batch = items.slice(i, i + 500);
    const ops = batch.map(item => ({
      updateOne: {
        filter: { [uniqueKey]: item[uniqueKey] },
        update: { $set: item },
        upsert: true,
      },
    }));
    const result = await collection.bulkWrite(ops, { ordered: false });
    totalUpserted += result.upsertedCount;
    totalModified += result.modifiedCount;
  }

  return { upserted: totalUpserted, modified: totalModified };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('No MONGODB_URI in .env.local');

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db('lfx-mentorship');

  console.log('\n🚀 LFX Mentorship Data Pipeline\n');

  // Step 1: Fetch all projects
  console.log('  📦 Step 1: Fetching all projects from API...');
  const rawProjects = await fetchAllProjects();
  console.log(`    ✅ Total: ${rawProjects.length} raw projects\n`);

  // Step 2: Transform
  console.log('  🔄 Step 2: Transforming (filtering to 2021+)...');
  const unmatchedLog = [];
  const projects = transform(rawProjects, unmatchedLog);
  console.log(`    ✅ ${projects.length} project-term entries`);
  if (unmatchedLog.length > 0) console.log(`    ⚠ ${unmatchedLog.length} unmatched names`);

  // Step 3: Group into organizations
  console.log('\n  🏢 Step 3: Grouping into organizations...');
  const organizations = groupOrgs(projects);
  console.log(`    ✅ ${organizations.length} organizations`);

  // Step 4: Build metadata
  console.log('\n  📊 Step 4: Building metadata...');
  const meta = buildMeta(organizations, projects);
  console.log(`    ✅ ${meta.totalOrganizations} orgs, ${meta.totalProjects} projects`);

  // Step 5: Push to MongoDB (idempotent upserts)
  console.log('\n  💾 Step 5: Pushing to MongoDB...');

  // Organizations — upsert by slug
  const orgResult = await upsertBatch(db.collection('organizations'), organizations, 'slug');
  console.log(`    Organizations: ${orgResult.upserted} new, ${orgResult.modified} updated`);

  // Projects — upsert by composite key (projectId + termId)
  const projectsWithKey = projects.map(p => ({
    ...p,
    _compositeKey: `${p.id}_${p.term.id}`,
  }));
  const projResult = await upsertBatch(db.collection('projects'), projectsWithKey, '_compositeKey');
  console.log(`    Projects: ${projResult.upserted} new, ${projResult.modified} updated`);

  // Meta — single document upsert
  await db.collection('meta').updateOne(
    { _type: 'meta' },
    { $set: { ...meta, _type: 'meta', lastUpdated: new Date().toISOString() } },
    { upsert: true }
  );
  console.log(`    Meta: updated`);

  // Step 6: Create indexes
  console.log('\n  📇 Step 6: Creating indexes...');
  await db.collection('organizations').createIndex({ slug: 1 }, { unique: true }).catch(() => {});
  await db.collection('projects').createIndex({ orgSlug: 1 }).catch(() => {});
  await db.collection('projects').createIndex({ _compositeKey: 1 }, { unique: true }).catch(() => {});
  console.log('    ✅ Indexes ready');

  // Final summary
  console.log(`\n  ✅ ALL DONE!`);
  console.log(`    📦 ${organizations.length} organizations`);
  console.log(`    📋 ${projects.length} projects`);
  console.log(`    🏛️ Foundations: ${meta.foundations?.join(', ')}`);
  console.log(`    📅 Years: ${meta.years?.join(', ')}`);
  console.log('');

  await client.close();
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
