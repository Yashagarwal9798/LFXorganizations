'use client';

import { useMemo, useDeferredValue } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { filterOrgs, sortOrgs } from '@/lib/filters';
import OrgCard from './OrgCard';
import NoResults from './NoResults';
import Select from '@/components/ui/Select';
import { SORT_OPTIONS } from '@/lib/constants';

export default function OrgGrid({ organizations }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const skillParam = searchParams.get('skills') || '';
  const selectedSkills = skillParam ? skillParam.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const yearsParam = searchParams.get('years') || '';
  const termsParam = searchParams.get('terms') || '';

  const filters = {
    search: searchParams.get('search') || '',
    years: yearsParam ? yearsParam.split(',').map((y) => y.trim()).filter(Boolean) : [],
    terms: termsParam ? termsParam.split(',').map((t) => t.trim()).filter(Boolean) : [],
    season: searchParams.get('season') || '', // legacy fallback
    foundation: searchParams.get('foundation') || '',
    skills: selectedSkills,
  };
  const sortBy = searchParams.get('sort') || 'alpha';

  const filtered = useMemo(
    () => sortOrgs(filterOrgs(organizations, filters), sortBy),
    [organizations, filters.search, yearsParam, termsParam, filters.season, filters.foundation, skillParam, sortBy]
  );

  const deferredFiltered = useDeferredValue(filtered);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {deferredFiltered.length} organization{deferredFiltered.length !== 1 ? 's' : ''}
        </p>
        <div className="w-44">
          <Select
            value={sortBy}
            onChange={(val) => {
              const params = new URLSearchParams(searchParams.toString());
              if (val && val !== 'alpha') {
                params.set('sort', val);
              } else {
                params.delete('sort');
              }
              router.replace(`?${params.toString()}`, { scroll: false });
            }}
            options={SORT_OPTIONS}
            placeholder="Sort by..."
          />
        </div>
      </div>

      {deferredFiltered.length === 0 ? (
        <NoResults />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deferredFiltered.map((org) => (
            <OrgCard key={org.slug} org={org} />
          ))}
        </div>
      )}
    </div>
  );
}
