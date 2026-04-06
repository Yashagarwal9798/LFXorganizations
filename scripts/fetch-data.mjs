import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { fetchAllPages } from './api-client.mjs';
import { transform } from './transform.mjs';
import { linkMentees } from './link-mentees.mjs';
import { groupOrgs, buildMeta } from './group-orgs.mjs';
import { writeDataToFiles, writeDataToMongo } from './writer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (scripts run outside Next.js)
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

// The LFX API has 60,000+ project entries. We cap at 200 pages (20,000 items)
// to avoid connection timeouts. Pass --max-pages=N to override.
const maxPagesArg = process.argv.find((a) => a.startsWith('--max-pages='));
const MAX_PAGES = maxPagesArg ? parseInt(maxPagesArg.split('=')[1]) : 200;

async function main() {
  console.log('\n🔄 LFX Mentorship Data Pipeline\n');
  if (MAX_PAGES !== Infinity) {
    console.log(`  (Limited to ${MAX_PAGES} pages per endpoint)\n`);
  }

  // Step 1: Fetch all projects
  console.log('Step 1/6: Fetching projects...');
  const rawProjects = await fetchAllPages(
    '/projects',
    'projects',
    { orderBy: 'name', order: 'asc' },
    MAX_PAGES
  );

  // Step 2: Transform projects
  console.log('\nStep 2/6: Transforming projects...');
  const unmatchedLog = [];
  const projects = transform(rawProjects, unmatchedLog);
  console.log(`  ✓ Transformed ${projects.length} project entries`);

  if (unmatchedLog.length > 0) {
    console.log(`  ⚠ ${unmatchedLog.length} projects had unparseable names`);
    writeFileSync(
      join(__dirname, 'unmatched-names.log'),
      unmatchedLog.join('\n'),
      'utf-8'
    );
  }

  // Step 3: Fetch all mentees
  console.log('\nStep 3/6: Fetching mentees...');
  const rawMentees = await fetchAllPages('/mentees', 'users', {}, MAX_PAGES);

  // Step 4: Link mentees to projects
  console.log('\nStep 4/6: Linking mentees to projects...');
  linkMentees(projects, rawMentees);

  // Step 5: Group into organizations
  console.log('\nStep 5/6: Grouping into organizations...');
  const organizations = groupOrgs(projects);

  // Step 6: Build meta + write
  console.log('\nStep 6/6: Building metadata and writing...');
  const meta = buildMeta(organizations, projects);

  // Write to MongoDB if URI is available, otherwise fall back to JSON files
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    console.log('\n  Writing to MongoDB...');
    await writeDataToMongo(organizations, projects, meta, mongoUri);
  } else {
    console.log('\n  No MONGODB_URI found, writing to JSON files...');
    writeDataToFiles(organizations, projects, meta);
  }

  console.log('\n✅ Data pipeline complete!\n');
}

main().catch((err) => {
  console.error('\n❌ Pipeline failed:', err.message);
  process.exit(1);
});
