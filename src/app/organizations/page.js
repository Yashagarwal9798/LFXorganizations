import { Suspense } from 'react';
import { loadOrganizations, loadMeta } from '@/lib/data';
import FilterBar from '@/components/home/FilterBar';
import OrgGrid from '@/components/home/OrgGrid';

export const metadata = {
  title: 'Organizations Directory | LFX Mentorship',
  description: 'Browse organizations participating in the LFX Mentorship program.',
};

export default async function OrganizationsDirectoryPage() {
  const { organizations } = await loadOrganizations();
  const meta = await loadMeta();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 border-b border-cyber-outline/20 pb-8">
        <h1 className="text-4xl font-display font-bold text-cyber-fg tracking-tight">
          Organization Directory
        </h1>
        <p className="mt-4 text-cyber-fg-muted font-mono leading-relaxed max-w-3xl">
          Browse the complete directory of organizations. Use the filters to drill down into specific technologies, foundations, or historical participation terms.
        </p>
      </div>

      <Suspense fallback={null}>
        <section className="flex flex-col md:flex-row gap-12 items-start relative z-20">
          <aside className="w-full md:w-80 shrink-0 sticky top-24">
            <div className="bg-glass-card rounded-xl p-6 max-h-[calc(100vh-8rem)] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <h2 className="text-xl font-display font-medium text-cyber-fg mb-6">Refine Search</h2>
              <FilterBar meta={meta} />
            </div>
          </aside>
          
          <main className="flex-1 w-full">
            <OrgGrid organizations={organizations} />
          </main>
        </section>
      </Suspense>
    </div>
  );
}
