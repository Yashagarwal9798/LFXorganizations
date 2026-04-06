const BASE = 'https://api.mentorship.lfx.linuxfoundation.org';

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = 3000 * (i + 1);
      console.log(`    Retry ${i + 1}/${retries} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export async function fetchAllPages(path, key, params = {}, maxPages = Infinity) {
  const results = [];
  let pageKey = '';
  let page = 1;

  do {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set('pageSize', '100');
    if (pageKey) url.searchParams.set('pageKey', pageKey);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    if (page % 25 === 1 || page <= 3) {
      console.log(`  Fetching ${path} page ${page}...`);
    }

    const res = await fetchWithRetry(url.toString());
    const data = await res.json();
    const items = data[key] ?? [];
    results.push(...items);
    pageKey = data.nextPageKey ?? '';
    page++;

    // Throttle to avoid rate limits
    await new Promise((r) => setTimeout(r, 100));

    if (page > maxPages) {
      console.log(`  ⚠ Reached max page limit (${maxPages}), stopping.`);
      break;
    }
  } while (pageKey);

  console.log(`  ✓ Fetched ${results.length} ${key} total (${page - 1} pages)`);
  return results;
}
