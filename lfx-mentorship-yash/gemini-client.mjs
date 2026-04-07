import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, 'gemini-org-cache.json');

// Load cache from disk
function loadCache() {
  if (existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Save cache to disk
function saveCache(cache) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * Ask Gemini to extract org names for a batch of projects.
 * Uses the official @google/genai SDK.
 */
async function askGemini(projects, ai, model) {
  const projectSummaries = projects.map((p, i) => {
    return [
      `Project ${i + 1}:`,
      `  ID: ${p.projectId}`,
      `  Name: "${p.name}"`,
      `  Description (first 200 chars): "${(p.description || '').replace(/<[^>]*>/g, '').substring(0, 200)}"`,
      p.lfProjectName ? `  LF Project: "${p.lfProjectName}"` : null,
      p.repoLink ? `  Repo: "${p.repoLink}"` : null,
      p.websiteUrl ? `  Website: "${p.websiteUrl}"` : null,
      p.industry ? `  Industry: "${p.industry}"` : null,
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  const prompt = `You are analyzing LFX Mentorship projects from the Linux Foundation.
Each project below belongs to an open-source organization or sub-project.

Your task: For each project, extract the SPECIFIC SUB-PROJECT or ORGANIZATION NAME.

IMPORTANT: Return the sub-project name, NOT the parent foundation umbrella.

Examples:
- "CNCF - Kyverno: Add feature X" → orgName is "Kyverno" (NOT "CNCF")
- "Hyperledger - Fabric: Build SDK" → orgName is "Fabric" (NOT "Hyperledger")
- "CNCF - CoreDNS: Improve caching" → orgName is "CoreDNS" (NOT "CNCF")
- "AI powered mainframe data modernization" with website "openmainframeproject.org" → orgName is "Open Mainframe Project"
- "LFDT - Advanced Threshold Key Management" → orgName is "LF Decentralized Trust"
- "KubeVirt quarterly fuzzing report" → orgName is "KubeVirt"

If there is NO sub-project (the project directly belongs to a foundation), use the foundation name.

Here are the projects:

${projectSummaries}

Respond with ONLY a valid JSON array where each element has "projectId" and "orgName". Example:
[{"projectId":"abc123","orgName":"Kyverno"}]

No markdown, no explanation, ONLY the JSON array.`;

  // Retry with exponential backoff for rate limits
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(15000 * Math.pow(2, attempt - 1), 60000);
      console.log(`      ⏳ Rate limited, waiting ${delay / 1000}s (attempt ${attempt + 1}/5)...`);
      await new Promise(r => setTimeout(r, delay));
    }

    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      });

      const text = response.text || '';

      // Parse JSON from response (strip markdown fences if present)
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      try {
        return JSON.parse(cleaned);
      } catch (err) {
        console.error('    ⚠ Failed to parse Gemini response:', cleaned.substring(0, 200));
        return [];
      }
    } catch (err) {
      if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Gemini API failed after retries');
}

/**
 * Resolve org names for unresolved projects using Gemini (with caching).
 * @param {Array} unresolvedProjects - projects that need Gemini resolution
 * @param {string} apiKey - Gemini API key
 * @param {string} model - model ID (e.g. "gemini-2.5-flash")
 * @returns {Map<string, string>} projectId -> orgName
 */
export async function resolveWithGemini(unresolvedProjects, apiKey, model) {
  const ai = new GoogleGenAI({ apiKey });
  const cache = loadCache();
  const results = new Map();
  const toResolve = [];

  // Check cache first
  for (const p of unresolvedProjects) {
    if (cache[p.projectId]) {
      results.set(p.projectId, cache[p.projectId]);
    } else {
      toResolve.push(p);
    }
  }

  if (toResolve.length === 0) {
    console.log(`    ✓ All ${unresolvedProjects.length} resolved from cache`);
    return results;
  }

  console.log(`    📡 Need Gemini for ${toResolve.length} projects (${unresolvedProjects.length - toResolve.length} cached)`);

  // Bigger batches - 54 already cached, ~59 remaining = ~6 calls
  const BATCH_SIZE = 10;
  for (let i = 0; i < toResolve.length; i += BATCH_SIZE) {
    const batch = toResolve.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toResolve.length / BATCH_SIZE);

    console.log(`    🤖 Gemini batch ${batchNum}/${totalBatches} (${batch.length} projects)...`);

    try {
      const geminiResults = await askGemini(batch, ai, model);

      for (const item of geminiResults) {
        if (item.projectId && item.orgName) {
          results.set(item.projectId, item.orgName);
          cache[item.projectId] = item.orgName;
        }
      }
      // Save after each batch for resilience
      saveCache(cache);
      console.log(`      ✓ Resolved ${geminiResults.length} projects`);
    } catch (err) {
      console.error(`    ❌ Gemini batch ${batchNum} failed:`, err.message);
    }

    // Rate limit: wait 10s between batches
    if (i + BATCH_SIZE < toResolve.length) {
      await new Promise(r => setTimeout(r, 10000));
    }
  }

  // Save final cache
  saveCache(cache);
  console.log(`    ✓ Cache saved (${Object.keys(cache).length} total entries)`);

  return results;
}
