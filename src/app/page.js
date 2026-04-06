import { Suspense } from 'react';
import { loadOrganizations, loadMeta } from '@/lib/data';
import HeroSection from '@/components/home/HeroSection';
import FilterBar from '@/components/home/FilterBar';
import OrgGrid from '@/components/home/OrgGrid';

export default async function HomePage() {
  const { organizations } = await loadOrganizations();
  const meta = await loadMeta();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <HeroSection meta={meta} />

      <Suspense fallback={null}>
        <section className="pb-12 space-y-6">
          <FilterBar meta={meta} />
          <OrgGrid organizations={organizations} />
        </section>
      </Suspense>
    </div>
  );
}
