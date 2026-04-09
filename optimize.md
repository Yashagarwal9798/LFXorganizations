# 🚀 LFX Organizations — Complete Optimization Report

I've gone through every single file in your codebase. Below is everything I found, explained in very simple words, grouped by category. Each item tells you **what the problem is**, **why it matters**, and **how to fix it**.

---

## Table of Contents

1. [🖼️ Image Optimization](#1--image-optimization)
2. [📦 Bundle Size & Code Splitting](#2--bundle-size--code-splitting)
3. [🔄 Unnecessary Re-renders (React Performance)](#3--unnecessary-re-renders-react-performance)
4. [🗄️ Data Fetching & Caching](#4--data-fetching--caching)
5. [🧠 Client vs Server Component Mistakes](#5--client-vs-server-component-mistakes)
6. [⚡ Search & Filter Performance](#6--search--filter-performance)
7. [🌐 Network & Loading Optimizations](#7--network--loading-optimizations)
8. [🏗️ Next.js Configuration Issues](#8--nextjs-configuration-issues)
9. [♿ Accessibility & SEO](#9--accessibility--seo)
10. [🐛 Bugs That Affect Performance](#10--bugs-that-affect-performance)
11. [📊 Priority Summary Table](#11--priority-summary-table)

---

## 1. 🖼️ Image Optimization

### Problem 1.1: Images are NOT optimized at all
**File:** [next.config.mjs](file:///c:/Users/BIT/Desktop/LFXorganization/next.config.mjs)

```js
images: {
  unoptimized: true,  // ❌ This turns OFF all image optimization
}
```

**What this means in simple words:**  
Next.js has a built-in system that takes your images and makes them smaller/faster (converts to WebP, resizes them, lazy loads them). By setting `unoptimized: true`, you've told Next.js: *"Don't touch my images at all"*. So every logo, every avatar loads at full size, full quality, even if it's only shown as a tiny 56px thumbnail.

**Why it matters:**  
- A logo that should be 5KB might be loading as 500KB
- On slow networks (mobile data), this makes pages feel very sluggish
- This is probably the **single biggest performance win** you can get

**How to fix:**
```js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // or list specific domains like 'avatars.githubusercontent.com'
      },
    ],
  },
};
```

Then replace all `<img>` tags with Next.js `<Image>` component:
```jsx
// Before ❌
<img src={org.logoUrl} alt={org.displayName} className="h-full w-full object-contain p-2" />

// After ✅
import Image from 'next/image';
<Image src={org.logoUrl} alt={org.displayName} width={56} height={56} className="object-contain p-2" />
```

**Files that need this change:**
- [OrgCard.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/OrgCard.jsx#L24-L27) — org logos (56x56 thumbnails)
- [OrgHeader.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/org-detail/OrgHeader.jsx#L31-L32) — big org logo (144x144)
- [Avatar.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/ui/Avatar.jsx#L17-L21) — mentor/mentee avatars (24-40px)

> [!IMPORTANT]
> This single change can reduce page load time by **30-60%** on the organizations grid page because you're loading dozens of logos.

---

### Problem 1.2: No fallback or error handling for broken images
**File:** [Avatar.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/ui/Avatar.jsx)

If a mentor's avatar URL is broken (404), the `<img>` tag shows a broken image icon. There's no `onError` fallback.

**How to fix:** Add `onError` to fall back to initials:
```jsx
<img
  src={src}
  alt={name || ''}
  onError={(e) => { e.target.style.display = 'none'; }}
  className={...}
/>
```

---

## 2. 📦 Bundle Size & Code Splitting

### Problem 2.1: Recharts loads on EVERY page (even when not needed)
**File:** [TermChart.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/org-detail/TermChart.jsx)

```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
```

**What this means in simple words:**  
Recharts is a **heavy** charting library (~200KB+ of JavaScript). Right now, even if someone visits the home page or the organizations list, this library might still get included in the JavaScript bundle because Next.js isn't told to treat it specially. Plus, even on the org detail page, the chart isn't visible until you scroll down — yet it loads immediately.

**Why it matters:**  
- Adds ~200KB to your JavaScript bundle
- Users wait for chart code to download even if they never scroll down to see it

**How to fix:** Use `next/dynamic` to lazy-load it:
```jsx
import dynamic from 'next/dynamic';

const TermChart = dynamic(() => import('@/components/org-detail/TermChart'), {
  loading: () => <div className="h-64 animate-pulse bg-cyber-surface rounded" />,
  ssr: false,  // Charts don't need server-side rendering
});
```

> [!TIP]
> This removes ~200KB from the initial JavaScript load. The chart code only downloads when someone actually visits an org detail page.

---

### Problem 2.2: ComboBox creates a Portal on every render
**File:** [ComboBox.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/ui/ComboBox.jsx#L200-L258)

`createPortal` is used to render the dropdown. While this is fine for positioning, the portal renders ~263 lines of JSX with all skill options each time the dropdown opens. If you have 500+ skills, that's 500+ DOM nodes appearing all at once.

**Why it matters:**  
Opening the skills dropdown creates hundreds of DOM nodes instantly, which can cause a visible "freeze" or stutter.

**How to fix:** Add **virtualization** — only render the skills visible in the dropdown viewport:
```jsx
// Simple approach: limit visible items
const VISIBLE_LIMIT = 50;
const visibleFiltered = filtered.slice(0, VISIBLE_LIMIT);

// Show a "scroll for more" message if truncated
{filtered.length > VISIBLE_LIMIT && (
  <div className="text-xs text-center text-cyber-outline py-2">
    Showing {VISIBLE_LIMIT} of {filtered.length} — type to narrow down
  </div>
)}
```

Or use a proper library like `react-window` for true virtualization.

---

## 3. 🔄 Unnecessary Re-renders (React Performance)

### Problem 3.1: OrgGrid re-filters/re-sorts on EVERY URL change
**File:** [OrgGrid.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/OrgGrid.jsx#L26-L29)

```jsx
const filtered = useMemo(
  () => sortOrgs(filterOrgs(organizations, filters), sortBy),
  [organizations, filters.search, filters.year, filters.season, filters.foundation, skillParam, sortBy]
);
```

**What this means in simple words:**  
The `useMemo` dependency list is correct, BUT the `filters` object is recreated on every render (line 17-23). Since `filters` is a new object every time, React sees it as "changed" and the memo works only because you spread individual properties. This is actually *correct* — but there's a subtlety...

The real problem is: `filters.search` updates on **every keystroke** (after 300ms debounce from SearchInput). Each time, the entire list of orgs gets filtered from scratch. If you have 500+ orgs with complex skill matching, that's a lot of CPU work.

**How to fix:** The search debounce at 300ms is good, but you can add `useDeferredValue` for the filtered results so React doesn't block the UI:
```jsx
import { useMemo, useDeferredValue } from 'react';

const filtered = useMemo(
  () => sortOrgs(filterOrgs(organizations, filters), sortBy),
  [organizations, filters.search, filters.year, filters.season, filters.foundation, skillParam, sortBy]
);

const deferredFiltered = useDeferredValue(filtered);
// Use deferredFiltered for rendering cards
```

---

### Problem 3.2: Every OrgCard re-renders when ANY filter changes
**File:** [OrgCard.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/OrgCard.jsx)

When you type in search or change any filter, the `filtered` array changes, and React re-renders ALL visible OrgCards — even the ones that haven't changed.

**Why it matters:**  
If you have 100 visible cards, all 100 re-render even if only the sort order changed.

**How to fix:** Wrap OrgCard with `React.memo`:
```jsx
import { memo } from 'react';

const OrgCard = memo(function OrgCard({ org }) {
  // ... existing code
});

export default OrgCard;
```

This tells React: *"Only re-render this card if the `org` prop actually changed."*

---

### Problem 3.3: AnimatedCounter re-animates when it shouldn't
**File:** [HeroSection.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/HeroSection.jsx#L6-L37)

The counter uses `setInterval` to animate from 0 to the target number. This creates **40 state updates** per counter (3 counters = **120 state updates**) when the page loads. Each state update causes a re-render.

**Why it matters:**  
120 re-renders in 1.5 seconds on page load. While not terrible, it's wasteful.

**How to fix:** Use `requestAnimationFrame` instead of `setInterval` and use a single ref to track the animation:
```jsx
useEffect(() => {
  if (end === 0) return;
  const start = performance.now();
  const duration = 1500;
  
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    setCount(Math.floor(progress * end));
    if (progress < 1) requestAnimationFrame(tick);
  }
  
  requestAnimationFrame(tick);
}, [end]);
```

> [!TIP]
> `requestAnimationFrame` is smoother because it syncs with the screen refresh rate (usually 60fps) instead of running at arbitrary intervals.

---

### Problem 3.4: FilterBar calls `readFromURL()` on every render
**File:** [FilterBar.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/FilterBar.jsx#L48)

```jsx
const applied = readFromURL();  // Called EVERY render, not memoized
```

This function runs every time FilterBar renders (which happens often due to search typing). It creates new objects each time.

**How to fix:** Wrap it in `useMemo`:
```jsx
const applied = useMemo(() => readFromURL(), [searchParams]);
```

---

## 4. 🗄️ Data Fetching & Caching

### Problem 4.1: No caching for MongoDB queries
**File:** [data.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/lib/data.js)

Every time someone visits the organizations page, `loadOrganizations()` hits MongoDB directly. There's no caching at all.

**What this means in simple words:**  
If 100 people visit your site in a minute, that's 100 database queries for the exact same data. Since your data only changes weekly (when you run `fetch-data`), this is very wasteful.

**Why it matters:**  
- Slower page loads (each request waits for MongoDB)
- Higher MongoDB costs/load
- If MongoDB is far away geographically, latency adds up

**How to fix:** Use Next.js `unstable_cache` (or React's `cache`):
```jsx
import { unstable_cache } from 'next/cache';

export const loadOrganizations = unstable_cache(
  async () => {
    const db = await getDb();
    const organizations = await db.collection('organizations').find({}, {
      projection: { /* ... */ }
    }).sort({ name: 1 }).toArray();
    return { organizations, lastUpdated: new Date().toISOString() };
  },
  ['organizations-list'],
  { revalidate: 3600 }  // Re-fetch from DB at most every 1 hour
);
```

> [!IMPORTANT]
> This is the **second biggest performance win** after image optimization. Your data changes weekly, but you're querying the DB on every single page view.

---

### Problem 4.2: Org detail page makes 3 separate DB queries
**File:** [organizations/[slug]/page.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/organizations/%5Bslug%5D/page.jsx)

```jsx
// In generateMetadata:
const org = await getOrgBySlug(slug);   // Query 1

// In OrgDetailPage:
const org = await getOrgBySlug(slug);   // Query 2 (same query again!)
const projects = await getProjectsByOrgSlug(slug);  // Query 3
```

**What this means in simple words:**  
The same org data is fetched TWICE — once for metadata (page title) and once for the page content. Next.js dedupes `fetch()` calls automatically, but your MongoDB driver doesn't get deduped.

**How to fix:** Use React's `cache()` to deduplicate:
```jsx
import { cache } from 'react';

export const getOrgBySlug = cache(async (slug) => {
  const db = await getDb();
  const org = await db.collection('organizations').findOne({ slug });
  if (org) delete org._id;
  return org;
});
```

Now the second call to `getOrgBySlug(slug)` returns the cached result from the first call within the same request.

---

### Problem 4.3: `loadProjects()` fetches ALL projects with NO projection
**File:** [data.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/lib/data.js#L34-L38)

```jsx
export async function loadProjects() {
  const db = await getDb();
  const projects = await db.collection('projects').find({}).toArray();  // ❌ No projection, no filter
  return { projects, lastUpdated: new Date().toISOString() };
}
```

**What this means in simple words:**  
This function grabs EVERYTHING from the projects collection — every field, every document. If you have 1000+ projects with descriptions, mentors, mentees etc., this could be several MB of data.

**Why it matters:**  
Even though nobody seems to call this function right now, it's a ticking time bomb. If anyone imports it, they'll download the entire projects collection.

**How to fix:** Either delete it (if unused) or add a projection like you did for `loadOrganizations`.

---

### Problem 4.4: Double `lastUpdated` assignment
**File:** [layout.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/layout.js#L27)

```jsx
lastUpdated = lastUpdated = meta?.lastUpdated || null;  // ❌ Double assignment
```

Not a performance issue, but it's a bug/typo that makes the code confusing.

---

## 5. 🧠 Client vs Server Component Mistakes

### Problem 5.1: OrgCard could be a Server Component
**File:** [OrgCard.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/OrgCard.jsx)

OrgCard has NO `'use client'` directive and uses NO hooks or browser APIs. That's good! It IS a server component. But it's rendered inside `OrgGrid` which IS a client component (`'use client'`).

**What this means in simple words:**  
When a parent component is `'use client'`, all its children automatically become client components too, even if they don't need to be. So OrgCard's HTML is generated on the server but then *also* sent as JavaScript to the browser for hydration.

**Why it matters:**  
All 200+ OrgCards are included in the client-side JavaScript bundle, making it bigger.

**How to fix:** This is a structural issue. The ideal fix is to split OrgGrid into:
1. A **server component** that fetches/filters data
2. A thin **client component** that only handles the filter state

This is a bigger refactor but would remove hundreds of card components from the client bundle.

---

### Problem 5.2: TermTimeline is a Server Component but contains Client Components
**File:** [TermTimeline.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/org-detail/TermTimeline.jsx)

TermTimeline has no `'use client'` — it's a server component. But it imports `ProjectCard` which IS `'use client'` (because of the expand/collapse `useState`). This is fine, but...

**Optimization opportunity:** The grouping/sorting logic in TermTimeline runs on the server (good!), but all the ProjectCard JSX ships to the client. If you have 50 projects, that's 50 `ProjectCard`s in the client bundle.

**How to fix:** Consider showing project details in a different way (like a Modal that lazy-loads) instead of an expand/collapse that requires `useState` in every card.

---

## 6. ⚡ Search & Filter Performance

### Problem 6.1: Skills filter does case-insensitive comparison for EVERY org
**File:** [filters.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/lib/filters.js#L28-L34)

```jsx
if (filters.skills && filters.skills.length > 0) {
  result = result.filter((org) =>
    filters.skills.every((skill) =>
      org.skills.some((s) => s.toLowerCase() === skill.toLowerCase())
    )
  );
}
```

**What this means in simple words:**  
For each org, for each selected skill, for each org skill → call `.toLowerCase()`. If you have 200 orgs, each with 10 skills, and 3 selected skills, that's: 200 × 3 × 10 = **6,000 `.toLowerCase()` calls**.

**How to fix:** Pre-normalize skills when loading data, so you never need `.toLowerCase()` during filtering:
```jsx
// When loading orgs, add a pre-lowercased skills set:
org.skillsLower = new Set(org.skills.map(s => s.toLowerCase()));

// Then filter becomes:
result = result.filter((org) =>
  filters.skills.every((skill) => org.skillsLower.has(skill.toLowerCase()))
);
```

Using a `Set` makes the lookup O(1) instead of O(n).

---

### Problem 6.2: Sort creates a new array copy every time
**File:** [filters.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/lib/filters.js#L39-L53)

```jsx
export function sortOrgs(organizations, sortBy) {
  const sorted = [...organizations];  // Creates a copy
  // ...
}
```

And it's called AFTER `filterOrgs`, which already returns a new array:
```jsx
const filtered = sortOrgs(filterOrgs(organizations, filters), sortBy);
```

`filterOrgs` already creates a copy with `let result = [...organizations]` and then `.filter()` creates ANOTHER copy. So you have:
1. `[...organizations]` — copy 1
2. `.filter()` — copy 2
3. `[...organizations]` in sortOrgs — copy 3

**How to fix:** Since `filterOrgs` already returns a new array, sort can mutate it directly:
```jsx
export function sortOrgs(organizations, sortBy) {
  // organizations is already a new array from filterOrgs, safe to mutate
  switch (sortBy) {
    case 'projects':
      return organizations.sort((a, b) => b.totalProjects - a.totalProjects);
    // ...
  }
}
```

Or better, change `filterOrgs` to not copy first:
```jsx
export function filterOrgs(organizations, filters) {
  let result = organizations;  // Don't copy — .filter() already creates a new array
  if (filters.search) {
    result = result.filter(...);
  }
  // ...
  return result;
}
```

---

### Problem 6.3: Search updates URL on every keystroke (after debounce)
**File:** [FilterBar.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/FilterBar.jsx#L37-L45)

```jsx
function updateSearch(value) {
  const params = new URLSearchParams(searchParams.toString());
  // ...
  router.replace(`?${params.toString()}`, { scroll: false });
}
```

Every search keystroke (debounced at 300ms) calls `router.replace()`, which triggers Next.js navigation. This causes:
1. `searchParams` to update
2. FilterBar to re-render
3. OrgGrid to re-render (via `useSearchParams`)
4. The entire filtered list to recompute

**Why it matters:**  
`router.replace()` is heavier than you think — it goes through Next.js's router, updates browser history, and can trigger layout recalculations.

**How to fix:** For search, consider using a local state in OrgGrid instead of URL params, and only sync to URL on explicit actions (like pressing Enter). Or use `startTransition` to mark the URL update as non-urgent:
```jsx
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

function updateSearch(value) {
  const params = new URLSearchParams(searchParams.toString());
  if (value) params.set('search', value);
  else params.delete('search');
  startTransition(() => {
    router.replace(`?${params.toString()}`, { scroll: false });
  });
}
```

---

## 7. 🌐 Network & Loading Optimizations

### Problem 7.1: No loading skeleton / Suspense for organization grid
**File:** [organizations/page.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/organizations/page.js#L26)

```jsx
<Suspense fallback={null}>
```

**What this means in simple words:**  
When the organizations page is loading, users see... nothing. Just blank space. The `fallback={null}` means "show nothing while loading."

**How to fix:** Add a skeleton loader:
```jsx
<Suspense fallback={
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="rounded-xl bg-glass-card p-5 animate-pulse h-48" />
    ))}
  </div>
}>
```

---

### Problem 7.2: No pagination — ALL orgs render at once
**File:** [OrgGrid.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/OrgGrid.jsx#L59-L63)

```jsx
{filtered.map((org) => (
  <OrgCard key={org.slug} org={org} />
))}
```

**What this means in simple words:**  
If you have 200 organizations, ALL 200 cards are rendered into the DOM at once. The user can only see maybe 9-12 cards at a time (above the fold), but all 200 are there.

**Why it matters:**  
- 200 DOM nodes × ~15 elements per card = **~3,000 DOM nodes** just for the grid
- Initial render is slow
- Browser uses more memory

**How to fix:** Add pagination or "infinite scroll":

**Option A — Simple Pagination:**
```jsx
const PAGE_SIZE = 24;
const [page, setPage] = useState(1);
const visible = filtered.slice(0, page * PAGE_SIZE);

// "Load More" button at the bottom
{visible.length < filtered.length && (
  <button onClick={() => setPage(p => p + 1)}>Load More</button>
)}
```

**Option B — Intersection Observer (Infinite Scroll):**
Show 24 cards initially, load 24 more when user scrolls near the bottom.

> [!IMPORTANT]
> This is a **high-impact optimization**. Rendering 200 cards at once is one of the most common performance bottlenecks in list-based UIs.

---

### Problem 7.3: Font loading could be optimized
**File:** [layout.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/layout.js#L1-L15)

You're loading two Google fonts: `Inter` and `Space_Grotesk`. Next.js handles this well with `next/font/google`, but you could add `display: 'swap'` explicitly:

```jsx
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',  // Shows fallback font immediately, swaps when loaded
});
```

---

## 8. 🏗️ Next.js Configuration Issues

### Problem 8.1: No MongoDB index on `slug` field
**File:** [data.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/lib/data.js#L61-L65)

```jsx
const org = await db.collection('organizations').findOne({ slug });
```

**What this means in simple words:**  
Every time someone visits `/organizations/kubernetes`, MongoDB has to scan through ALL organizations to find the one with `slug: 'kubernetes'`. Without an index, this is like looking for a name in a phone book that's not alphabetically sorted — you have to check every entry.

**How to fix:** Create indexes in MongoDB:
```js
db.collection('organizations').createIndex({ slug: 1 }, { unique: true });
db.collection('projects').createIndex({ orgSlug: 1 });
```

---

### Problem 8.2: No `generateStaticParams` for org detail pages
**File:** [organizations/[slug]/page.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/organizations/%5Bslug%5D/page.jsx)

**What this means in simple words:**  
Every org detail page is generated **on-demand** when someone visits it. Next.js supports pre-generating these pages at build time (Static Site Generation), which means pages load instantly because they're just pre-built HTML files.

**How to fix:**
```jsx
export async function generateStaticParams() {
  const { organizations } = await loadOrganizations();
  return organizations.map((org) => ({
    slug: org.slug,
  }));
}
```

> [!TIP]
> This pre-builds all organization pages at build time. Users get instant page loads — no waiting for DB queries.

---

### Problem 8.3: `prebuild` runs `fetch-data` on every build
**File:** [package.json](file:///c:/Users/BIT/Desktop/LFXorganization/package.json#L15)

```json
"prebuild": "npm run fetch-data"
```

This means every time you run `npm run build`, it fetches all data from the LFX API first. If the API is slow or down, your build fails.

**How to fix:** Consider making this optional or caching the fetched data:
```json
"prebuild": "npm run fetch-data || echo 'Using cached data'"
```

---

## 9. ♿ Accessibility & SEO

### Problem 9.1: About page uses wrong color classes
**File:** [about/page.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/about/page.jsx)

The about page uses generic Tailwind colors (`text-gray-600`, `text-blue-600`) instead of your custom cyber theme (`text-cyber-fg-muted`, `text-cyber-primary`). This makes it look inconsistent with the rest of the site.

---

### Problem 9.2: Missing `aria-label` on interactive elements
**Files:** Multiple components

- Sort dropdown in OrgGrid has no `aria-label`
- Filter dropdowns in FilterBar have no `aria-label`
- The expand/collapse button in ProjectCard has no `aria-label`

**How to fix:** Add `aria-label` attributes:
```jsx
<button aria-label={expanded ? 'Collapse project details' : 'Expand project details'}>
```

---

### Problem 9.3: Missing `<meta>` viewport and other SEO tags
**File:** [layout.js](file:///c:/Users/BIT/Desktop/LFXorganization/src/app/layout.js)

You have basic `title` and `description` metadata, but you're missing:
- Open Graph image
- Twitter card metadata
- Canonical URL
- Viewport meta tag (Next.js adds a default one, but explicit is better)

---

## 10. 🐛 Bugs That Affect Performance

### Problem 10.1: Sort uses `window.history.replaceState` instead of `router`
**File:** [OrgGrid.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/OrgGrid.jsx#L47-L48)

```jsx
window.history.replaceState(null, '', `?${params.toString()}`);
window.dispatchEvent(new Event('popstate'));
```

**What this means in simple words:**  
The sort dropdown directly manipulates browser history and then fakes a "browser back/forward" event (_popstate_) to trigger React to notice. This is hacky and can cause bugs:
- React might not always pick up the change
- It bypasses Next.js's router optimization
- Other components listening for `popstate` events (like FilterBar's `useEffect`) will re-run unnecessarily

**How to fix:** Use the same `router.replace()` pattern that FilterBar uses:
```jsx
const router = useRouter();
router.replace(`?${params.toString()}`, { scroll: false });
```

---

### Problem 10.2: `readFromURL` called inside `useState` initializer as function reference
**File:** [FilterBar.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/home/FilterBar.jsx#L25)

```jsx
const [draft, setDraft] = useState(readFromURL);  // Function reference
```

vs line 29:
```jsx
setDraft(readFromURL());  // Function call
```

The `useState(readFromURL)` passes the function itself (lazy initialization), which is correct. But `readFromURL` uses `searchParams` from the outer scope, which means it captures the initial value. This is fine for initialization but the inconsistency is confusing.

---

### Problem 10.3: Memory leak potential in SearchInput
**File:** [SearchInput.jsx](file:///c:/Users/BIT/Desktop/LFXorganization/src/components/ui/SearchInput.jsx#L16-L17)

```jsx
timer.current = setTimeout(() => onChange(val), 300);
```

If the component unmounts before the timeout fires, `onChange` might be called on an unmounted component.

**How to fix:** Clear timeout on unmount:
```jsx
useEffect(() => {
  return () => clearTimeout(timer.current);
}, []);
```

---

## 11. 📊 Priority Summary Table

Here's everything ranked by **impact** (how much it improves performance) and **effort** (how hard it is to implement):

| # | Optimization | Impact | Effort | Category |
|---|---|---|---|---|
| 1 | Enable Next.js Image optimization | 🔴 Very High | 🟢 Easy | Images |
| 2 | Add data caching (`unstable_cache`) | 🔴 Very High | 🟢 Easy | Data |
| 3 | Add pagination (load 24 cards at a time) | 🔴 Very High | 🟡 Medium | Rendering |
| 4 | Lazy-load Recharts with `next/dynamic` | 🟠 High | 🟢 Easy | Bundle |
| 5 | Use `React.memo` on OrgCard | 🟠 High | 🟢 Easy | Re-renders |
| 6 | Add `generateStaticParams` for SSG | 🟠 High | 🟢 Easy | Next.js |
| 7 | Deduplicate `getOrgBySlug` with `cache()` | 🟡 Medium | 🟢 Easy | Data |
| 8 | Pre-normalize skills (Set + lowercase) | 🟡 Medium | 🟢 Easy | Filtering |
| 9 | Fix sort to use `router.replace` | 🟡 Medium | 🟢 Easy | Bug |
| 10 | Add skeleton loader for Suspense | 🟡 Medium | 🟢 Easy | UX |
| 11 | Use `requestAnimationFrame` for counters | 🟢 Low | 🟢 Easy | Animation |
| 12 | Add MongoDB indexes | 🟡 Medium | 🟢 Easy | Database |
| 13 | Virtualize ComboBox dropdown | 🟡 Medium | 🟡 Medium | Rendering |
| 14 | Use `startTransition` for search | 🟡 Medium | 🟢 Easy | UX |
| 15 | Split OrgGrid into Server/Client | 🟠 High | 🔴 Hard | Architecture |
| 16 | Fix image error handling (Avatar) | 🟢 Low | 🟢 Easy | Images |
| 17 | Fix About page styling inconsistency | 🟢 Low | 🟢 Easy | Consistency |
| 18 | Add font display swap | 🟢 Low | 🟢 Easy | Fonts |
| 19 | Remove extra array copies in filter/sort | 🟢 Low | 🟢 Easy | Memory |
| 20 | Add SEO meta tags | 🟢 Low | 🟢 Easy | SEO |

---

## 🎯 Recommended Action Plan

If you want to do this step by step, here's the order I'd recommend:

### Phase 1: Quick Wins (30 min each, huge impact)
1. ✅ Enable Next.js `<Image>` optimization
2. ✅ Add `unstable_cache` to data functions
3. ✅ Add `React.memo` to OrgCard
4. ✅ Lazy-load TermChart with `next/dynamic`

### Phase 2: Medium Effort (1-2 hours each)
5. ✅ Add pagination to OrgGrid
6. ✅ Add `generateStaticParams` for SSG
7. ✅ Deduplicate getOrgBySlug with `cache()`
8. ✅ Fix sort to use `router.replace`

### Phase 3: Polish
9. ✅ All the remaining items from the table

> [!NOTE]
> **Phase 1 alone could make your site 2-3x faster.** The image optimization and data caching are by far the biggest wins.

---

*Report generated from full codebase analysis — every file in `src/` was examined.*
