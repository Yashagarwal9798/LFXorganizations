import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { loadOrganizations, getOrgBySlug, getProjectsByOrgSlug } from '@/lib/data';
import OrgHeader from '@/components/org-detail/OrgHeader';
import OrgStats from '@/components/org-detail/OrgStats';
import TermTimeline from '@/components/org-detail/TermTimeline';

const TermChart = dynamic(() => import('@/components/org-detail/TermChart'), {
  loading: () => <div className="h-64 mt-4 animate-pulse bg-cyber-surface rounded-lg" />,
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return {};

  return {
    title: `${org.displayName} — LFX Mentorship`,
    description: org.description,
    openGraph: {
      title: `${org.displayName} — LFX Mentorship Organizations`,
      description: org.description,
      images: org.logoUrl ? [org.logoUrl] : [],
    },
  };
}

export default async function OrgDetailPage({ params }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const projects = await getProjectsByOrgSlug(slug);

  return (
    <div className="mx-auto max-w-screen-2xl px-4 pt-5 pb-8 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      <OrgHeader org={org} />
      
      <div className="mt-8 md:mt-12 flex flex-col md:flex-row gap-8 md:gap-12 items-start relative">
        <aside className="w-full md:w-[350px] shrink-0 space-y-8 relative z-20 md:sticky md:top-24">
          <div className="bg-glass-card rounded-xl p-6">
            <h2 className="text-xl font-display font-medium text-cyber-fg mb-6 border-b border-cyber-outline/20 pb-4">Organization Profile</h2>
            <OrgStats org={org} />
          </div>
          <div className="bg-glass-card rounded-xl p-6">
             <h2 className="text-lg font-display font-medium text-cyber-fg mb-6 text-center">Historical Activity</h2>
            <TermChart participations={org.participations} foundation={org.foundation} />
          </div>
        </aside>

        <main className="flex-1 w-full bg-glass-card rounded-xl p-5 sm:p-8 relative z-10">
          <h2 className="text-3xl font-display font-bold text-cyber-fg mb-8 text-gradient">Mentorship Projects</h2>
          <TermTimeline projects={projects} participations={org.participations} />
        </main>
      </div>
    </div>
  );
}
