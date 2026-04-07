import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { resolveWithGemini } from './gemini-client.mjs';
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
} catch {}

const GEMINI_API_KEY = 'AIzaSyC7JUK4UQ6T_n1Cea7OJkxnBckcl6Fjilg';
const GEMINI_MODEL = 'gemini-2.5-flash';
const DB_NAME = 'lfx-mentorship-yash';

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

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('No MONGODB_URI in .env.local');

  const baseUri = mongoUri.replace(/\/[^/?]+(\?|$)/, `/${DB_NAME}$1`);
  const yashMongoUri = baseUri.includes(DB_NAME) ? baseUri : mongoUri;

  const client = new MongoClient(yashMongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  🔧 Fix Fallback Projects (Gemini Resolver) ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  // ── Step 1: Find all fallback projects ─────────────────────────
  console.log('  📋 Step 1: Finding fallback projects...');
  const fallbackProjects = await db.collection('projects')
    .find({ orgSource: 'fallback' })
    .toArray();

  console.log(`    Found ${fallbackProjects.length} projects with orgSource="fallback"`);

  if (fallbackProjects.length === 0) {
    console.log('    ✅ No fallback projects to fix!');
    await client.close();
    return;
  }

  // ── Step 2: Deduplicate by project ID ──────────────────────────
  // Multiple term entries share the same project ID, resolve once
  const uniqueProjects = new Map();
  for (const p of fallbackProjects) {
    if (!uniqueProjects.has(p.id)) {
      uniqueProjects.set(p.id, {
        projectId: p.id,
        name: p.fullName,
        description: p.description || '',
        repoLink: p.repoLink || '',
        websiteUrl: p.websiteUrl || '',
      });
    }
  }

  console.log(`    Unique projects to resolve: ${uniqueProjects.size}`);

  // ── Step 3: Send to Gemini ─────────────────────────────────────
  console.log('\n  🤖 Step 3: Resolving with Gemini...');
  const geminiMap = await resolveWithGemini(
    [...uniqueProjects.values()],
    GEMINI_API_KEY,
    GEMINI_MODEL
  );

  console.log(`    ✅ Gemini resolved ${geminiMap.size} projects`);

  // ── Step 4: Update projects in MongoDB ─────────────────────────
  console.log('\n  💾 Step 4: Updating projects in MongoDB...');
  let updated = 0;
  let failed = 0;

  for (const [projectId, orgName] of geminiMap) {
    // Determine foundation from org name
    let foundation = 'Linux Foundation';
    for (const [key, val] of Object.entries(foundationMap)) {
      if (orgName.includes(key)) {
        foundation = val.label;
        break;
      }
    }

    const orgSlug = slugify(orgName);

    const result = await db.collection('projects').updateMany(
      { id: projectId, orgSource: 'fallback' },
      {
        $set: {
          orgRawName: orgName,
          displayName: orgName,
          orgSlug: orgSlug,
          foundation: foundation,
          orgSource: 'gemini',
        },
      }
    );

    updated += result.modifiedCount;
  }

  // Check remaining fallbacks (Gemini couldn't resolve)
  const remaining = await db.collection('projects')
    .countDocuments({ orgSource: 'fallback' });

  console.log(`    ✅ Updated ${updated} project entries`);
  if (remaining > 0) {
    console.log(`    ⚠ ${remaining} still unresolved (fallback)`);
  }

  // ── Step 5: Rebuild organizations ──────────────────────────────
  console.log('\n  🏢 Step 5: Rebuilding organizations collection...');

  // Drop old organizations
  await db.collection('organizations').drop().catch(() => {});
  console.log('    Dropped old organizations collection');

  // Read ALL projects and regroup
  const allProjects = await db.collection('projects').find({}).toArray();
  const organizations = groupOrgs(allProjects);

  // Insert new organizations
  if (organizations.length > 0) {
    await db.collection('organizations').insertMany(organizations);
    await db.collection('organizations').createIndex({ slug: 1 }, { unique: true }).catch(() => {});
  }
  console.log(`    ✅ Rebuilt ${organizations.length} organizations`);

  // ── Step 6: Update meta ────────────────────────────────────────
  console.log('\n  📊 Step 6: Updating meta...');
  const meta = buildMeta(organizations, allProjects);
  await db.collection('meta').updateOne(
    { _type: 'meta' },
    { $set: { ...meta, _type: 'meta', lastUpdated: new Date().toISOString() } },
    { upsert: true }
  );
  console.log(`    ✅ Meta updated`);

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n  ╔══════════════════════════════════╗');
  console.log('  ║         ✅ FIX COMPLETE!         ║');
  console.log('  ╚══════════════════════════════════╝');
  console.log(`    📦 ${organizations.length} organizations (was 125)`);
  console.log(`    📋 ${allProjects.length} projects`);
  console.log(`    🧠 Resolution: ${JSON.stringify(meta.sourceStats)}`);

  // Show source breakdown
  const fallbackOrgs = organizations.filter(o => o.orgSource === 'fallback');
  if (fallbackOrgs.length > 0) {
    console.log(`    ⚠ Still ${fallbackOrgs.length} fallback orgs:`);
    for (const o of fallbackOrgs.slice(0, 10)) {
      console.log(`       - "${o.name}"`);
    }
  }
  console.log('');

  await client.close();
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
