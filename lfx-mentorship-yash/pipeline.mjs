import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { extractAllOrgs } from './extract-org.mjs';
import { transform } from './transform.mjs';
import { groupOrgs, buildMeta } from './group-orgs.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ───────────────────────────────────────────────
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
} catch { }

// ─── Config ────────────────────────────────────────────────────────
const BASE = 'https://api.mentorship.lfx.linuxfoundation.org';
const GEMINI_API_KEY = '[GCP_API_KEY]';
const GEMINI_MODEL = 'gemini-2.5-flash';
const DB_NAME = 'lfx-mentorship-yash';

// ─── Fetch all projects from API ───────────────────────────────────
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

// ─── Upsert to MongoDB ─────────────────────────────────────────────
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

// ─── Main Pipeline ─────────────────────────────────────────────────
async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('No MONGODB_URI in .env.local');

  // Build URI for our separate database
  // Remove the original db name from the URI and use our own
  const baseUri = mongoUri.replace(/\/[^/?]+(\?|$)/, `/${DB_NAME}$1`);
  // If that didn't change anything (no db in path), append it
  const yashMongoUri = baseUri.includes(DB_NAME) ? baseUri : mongoUri;

  const client = new MongoClient(yashMongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  🚀 LFX Mentorship Pipeline (Yash - 3-Tier Extraction) ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  // ── Step 1: Fetch ──────────────────────────────────────────────
  console.log('  📦 Step 1: Fetching all projects from API...');
  const rawProjects = await fetchAllProjects();
  console.log(`    ✅ Total: ${rawProjects.length} raw projects\n`);

  // ── Step 2: Extract org names (3-tier) ─────────────────────────
  console.log('  🧠 Step 2: Extracting org names (3-tier)...');
  const orgMap = await extractAllOrgs(rawProjects, GEMINI_API_KEY, GEMINI_MODEL);
  console.log(`    ✅ ${orgMap.size} projects resolved\n`);

  // ── Step 3: Transform ──────────────────────────────────────────
  console.log('  🔄 Step 3: Transforming (filtering to 2021+)...');
  const unmatchedLog = [];
  const projects = transform(rawProjects, orgMap, unmatchedLog);
  console.log(`    ✅ ${projects.length} project-term entries`);
  if (unmatchedLog.length > 0) console.log(`    ⚠ ${unmatchedLog.length} unmatched names`);

  // ── Step 4: Group into organizations ───────────────────────────
  console.log('\n  🏢 Step 4: Grouping into organizations...');
  const organizations = groupOrgs(projects);
  console.log(`    ✅ ${organizations.length} organizations`);

  // ── Step 5: Build metadata ─────────────────────────────────────
  console.log('\n  📊 Step 5: Building metadata...');
  const meta = buildMeta(organizations, projects);
  console.log(`    ✅ ${meta.totalOrganizations} orgs, ${meta.totalProjects} projects`);
  console.log(`    📈 Resolution stats:`, JSON.stringify(meta.sourceStats));

  // ── Step 6: Push to MongoDB ────────────────────────────────────
  console.log(`\n  💾 Step 6: Pushing to MongoDB (${DB_NAME})...`);

  const orgResult = await upsertBatch(db.collection('organizations'), organizations, 'slug');
  console.log(`    Organizations: ${orgResult.upserted} new, ${orgResult.modified} updated`);

  const projectsWithKey = projects.map(p => ({
    ...p,
    _compositeKey: `${p.id}_${p.term.id}`,
  }));
  const projResult = await upsertBatch(db.collection('projects'), projectsWithKey, '_compositeKey');
  console.log(`    Projects: ${projResult.upserted} new, ${projResult.modified} updated`);

  await db.collection('meta').updateOne(
    { _type: 'meta' },
    { $set: { ...meta, _type: 'meta', lastUpdated: new Date().toISOString() } },
    { upsert: true }
  );
  console.log(`    Meta: updated`);

  // ── Step 7: Create indexes ─────────────────────────────────────
  console.log('\n  📇 Step 7: Creating indexes...');
  await db.collection('organizations').createIndex({ slug: 1 }, { unique: true }).catch(() => { });
  await db.collection('projects').createIndex({ orgSlug: 1 }).catch(() => { });
  await db.collection('projects').createIndex({ _compositeKey: 1 }, { unique: true }).catch(() => { });
  console.log('    ✅ Indexes ready');

  // ── Final Summary ──────────────────────────────────────────────
  console.log('\n  ╔════════════════════════════════╗');
  console.log('  ║        ✅ ALL DONE!            ║');
  console.log('  ╚════════════════════════════════╝');
  console.log(`    📦 ${organizations.length} organizations`);
  console.log(`    📋 ${projects.length} projects`);
  console.log(`    🏛️  Foundations: ${meta.foundations?.join(', ')}`);
  console.log(`    📅 Years: ${meta.years?.join(', ')}`);
  console.log(`    🧠 Resolution: ${JSON.stringify(meta.sourceStats)}`);
  console.log('');

  await client.close();
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
