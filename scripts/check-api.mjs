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

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('lfx-mentorship');

  // Check organizations data size
  const orgs = await db.collection('organizations').find({}).toArray();
  const orgsJson = JSON.stringify(orgs);
  console.log('--- Organizations ---');
  console.log(`  Count: ${orgs.length}`);
  console.log(`  JSON size: ${(orgsJson.length / 1024 / 1024).toFixed(2)} MB`);
  
  // Check a single org's size
  const sampleOrg = orgs[0];
  console.log(`  Sample org JSON size: ${(JSON.stringify(sampleOrg).length / 1024).toFixed(1)} KB`);
  console.log(`  Sample org skills: ${sampleOrg.skills?.length}`);
  console.log(`  Sample org participations: ${sampleOrg.participations?.length}`);

  // Find the largest org
  let maxSize = 0;
  let maxOrg = null;
  for (const org of orgs) {
    const size = JSON.stringify(org).length;
    if (size > maxSize) { maxSize = size; maxOrg = org; }
  }
  console.log(`  Largest org: "${maxOrg?.name}" at ${(maxSize / 1024).toFixed(1)} KB`);
  console.log(`    skills: ${maxOrg?.skills?.length}, participations: ${maxOrg?.participations?.length}`);

  // Check projects data size
  const projects = await db.collection('projects').find({}).toArray();
  const projJson = JSON.stringify(projects);
  console.log('\n--- Projects ---');
  console.log(`  Count: ${projects.length}`);
  console.log(`  JSON size: ${(projJson.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Sample project JSON: ${(JSON.stringify(projects[0]).length / 1024).toFixed(1)} KB`);

  // Check meta
  const meta = await db.collection('meta').findOne({});
  const metaJson = JSON.stringify(meta);
  console.log('\n--- Meta ---');
  console.log(`  JSON size: ${(metaJson.length / 1024).toFixed(1)} KB`);
  console.log(`  Skills array length: ${meta?.skills?.length}`);

  // Total data that home page loads
  console.log('\n--- Home Page Load ---');
  console.log(`  orgs + meta = ${((orgsJson.length + metaJson.length) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  This gets serialized into the HTML and sent to the browser!`);

  await client.close();
})();
