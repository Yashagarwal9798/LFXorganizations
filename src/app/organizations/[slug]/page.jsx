import { notFound } from 'next/navigation';
import { loadOrganizations, getOrgBySlug, getProjectsByOrgSlug } from '@/lib/data';
import OrgHeader from '@/components/org-detail/OrgHeader';
import OrgStats from '@/components/org-detail/OrgStats';
import TermChart from '@/components/org-detail/TermChart';
import TermTimeline from '@/components/org-detail/TermTimeline';

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <OrgHeader org={org} />
        <OrgStats org={org} />
        <TermChart participations={org.participations} foundation={org.foundation} />
        <TermTimeline projects={projects} participations={org.participations} />
      </div>
    </div>
  );
}
