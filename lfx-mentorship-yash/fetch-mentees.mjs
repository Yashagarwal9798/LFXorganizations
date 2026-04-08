/**
 * fetch-mentees.mjs
 * 
 * Fetches mentee data (graduated + accepted) from the LFX API,
 * updates the existing projects in MongoDB with mentee arrays,
 * and recalculates org-level totalMentees + meta.totalMentees.
 * 
 * Run AFTER normalize-and-reimport.mjs has populated the DB.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

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

const DB_NAME = 'lfx-mentorship-yash';
const BASE = 'https://api.mentorship.lfx.linuxfoundation.org';

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('No MONGODB_URI in .env.local');
  const baseUri = mongoUri.replace(/\/[^/?]+(\?|$)/, `/${DB_NAME}$1`);
  const client = new MongoClient(baseUri.includes(DB_NAME) ? baseUri : mongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  🎓 Fetch Mentees & Update MongoDB          ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Step 1: Fetch all projects from API (we only need mentee fields)
  console.log('  📦 Step 1: Fetching projects from API...');
  const menteeMap = new Map(); // projectId -> { graduated: [...], accepted: [...] }
  let from = 0, total = Infinity;

  while (from < total) {
    const url = `${BASE}/projects/cache/paginate?from=${from}&size=100&sortby=projectStatus&order=asc`;
    let data;
    for (let retry = 0; retry < 3; retry++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        break;
      } catch (err) {
        if (retry === 2) throw err;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    total = data.hits.total.value;

    for (const h of data.hits.hits) {
      const p = h._source;
      const graduated = (p.apprenticeNeeds?.graduatedMentees ?? []).map(m => ({
        id: m.userId,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        avatarUrl: m.logoUrl || null,
        status: 'graduated',
      }));
      const accepted = (p.apprenticeNeeds?.acceptedMentees ?? []).map(m => ({
        id: m.userId,
        name: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
        avatarUrl: m.logoUrl || null,
        status: 'accepted',
      }));
      if (graduated.length > 0 || accepted.length > 0) {
        menteeMap.set(p.projectId, [...graduated, ...accepted]);
      }
    }

    from += 100;
    process.stdout.write(`    Fetched ${Math.min(from, total)}/${total}\r`);
    await new Promise(r => setTimeout(r, 150));
  }

  const withMentees = menteeMap.size;
  let totalGraduated = 0, totalAccepted = 0;
  for (const mentees of menteeMap.values()) {
    totalGraduated += mentees.filter(m => m.status === 'graduated').length;
    totalAccepted += mentees.filter(m => m.status === 'accepted').length;
  }
  console.log(`\n    ✅ ${total} projects scanned`);
  console.log(`    🎓 ${withMentees} projects have mentees`);
  console.log(`    📊 ${totalGraduated} graduated, ${totalAccepted} accepted\n`);

  // Step 2: Update projects in MongoDB
  console.log('  💾 Step 2: Updating projects in MongoDB...');
  let updated = 0;
  for (const [projectId, mentees] of menteeMap) {
    const result = await db.collection('projects').updateMany(
      { id: projectId },
      { $set: { mentees } }
    );
    updated += result.modifiedCount;
  }
  console.log(`    ✅ ${updated} project documents updated\n`);

  // Step 3: Recalculate totalMentees for each organization
  console.log('  🏢 Step 3: Recalculating org mentee counts...');
  const orgs = await db.collection('organizations').find({}).toArray();
  let orgsUpdated = 0;

  for (const org of orgs) {
    // Get all projects for this org
    const orgProjects = await db.collection('projects')
      .find({ orgSlug: org.slug })
      .project({ mentees: 1 })
      .toArray();

    // Count unique graduated mentees
    const seenMentees = new Set();
    let orgMentees = 0;
    for (const p of orgProjects) {
      for (const m of (p.mentees || [])) {
        if (m.status === 'graduated' && m.id && !seenMentees.has(m.id)) {
          seenMentees.add(m.id);
          orgMentees++;
        }
      }
    }

    if (orgMentees !== org.totalMentees) {
      await db.collection('organizations').updateOne(
        { slug: org.slug },
        { $set: { totalMentees: orgMentees } }
      );
      orgsUpdated++;
    }
  }
  console.log(`    ✅ ${orgsUpdated} organizations updated\n`);

  // Step 4: Update meta
  console.log('  📊 Step 4: Updating meta...');
  const allOrgs = await db.collection('organizations').find({}).toArray();
  const grandTotalMentees = allOrgs.reduce((sum, o) => sum + o.totalMentees, 0);
  await db.collection('meta').updateOne(
    { _type: 'meta' },
    { $set: { totalMentees: grandTotalMentees, lastUpdated: new Date().toISOString() } }
  );
  console.log(`    ✅ Total graduated mentees across all orgs: ${grandTotalMentees}\n`);

  // Summary: Top orgs by mentees
  const topByMentees = allOrgs
    .filter(o => o.totalMentees > 0)
    .sort((a, b) => b.totalMentees - a.totalMentees)
    .slice(0, 15);

  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║              ✅ MENTEES DONE!               ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log(`    🎓 ${grandTotalMentees} graduated mentees total\n`);
  console.log('  📊 Top 15 orgs by graduated mentees:');
  for (const o of topByMentees) {
    console.log(`    ${o.totalMentees.toString().padStart(4)} │ ${o.displayName}`);
  }
  console.log('');

  await client.close();
}

main().catch(err => {
  console.error('\n❌', err.message, err.stack);
  process.exit(1);
});
