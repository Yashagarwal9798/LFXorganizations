'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import ComboBox from '@/components/ui/ComboBox';

export default function FilterBar({ meta }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const applied = useMemo(() => {
    const skillParam = searchParams.get('skills') || '';
    return {
      year: searchParams.get('year') || '',
      season: searchParams.get('season') || '',
      foundation: searchParams.get('foundation') || '',
      skills: skillParam ? skillParam.split(',').map((skill) => skill.trim()).filter(Boolean) : [],
    };
  }, [searchParams]);

  const [draft, setDraft] = useState(applied);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  function replaceParams(params) {
    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  function updateDraft(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateSearch(value) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }

    replaceParams(params);
  }

  const isDirty =
    draft.year !== applied.year ||
    draft.season !== applied.season ||
    draft.foundation !== applied.foundation ||
    draft.skills.join(',') !== applied.skills.join(',');

  const hasDraftFilters =
    draft.year || draft.season || draft.foundation || draft.skills.length > 0;
  const hasSearch = searchParams.get('search') || '';

  function applyFilters() {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');

    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (draft.year) params.set('year', draft.year);
    if (draft.season) params.set('season', draft.season);
    if (draft.foundation) params.set('foundation', draft.foundation);
    if (draft.skills.length > 0) params.set('skills', draft.skills.join(','));

    replaceParams(params);
  }

  function clearAll() {
    setDraft({ year: '', season: '', foundation: '', skills: [] });

    const params = new URLSearchParams();
    const sort = searchParams.get('sort');

    if (sort) params.set('sort', sort);

    replaceParams(params);
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <SearchInput value={hasSearch} onChange={updateSearch} />
      </div>

      <div className="space-y-4">
        <Select
          label="Year"
          value={draft.year}
          onChange={(val) => updateDraft('year', val || '')}
          options={meta.years.map((year) => ({ value: String(year), label: String(year) }))}
          placeholder="All Years"
        />
        <Select
          label="Term / Season"
          value={draft.season}
          onChange={(val) => updateDraft('season', val || '')}
          options={[
            { value: 'spring', label: 'Spring' },
            { value: 'summer', label: 'Summer' },
            { value: 'fall', label: 'Fall' },
          ]}
          placeholder="All Terms"
        />
        <Select
          label="Foundation"
          value={draft.foundation}
          onChange={(val) => updateDraft('foundation', val || '')}
          options={meta.foundations}
          placeholder="All Foundations"
        />
        <ComboBox
          label="Skills / Tech Stack"
          value={draft.skills}
          onChange={(val) => updateDraft('skills', val || [])}
          options={meta.skills}
          placeholder="All Skills"
        />
      </div>

      <button
        onClick={applyFilters}
        disabled={!isDirty}
        className={`mt-6 w-full rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
          isDirty
            ? 'cursor-pointer bg-cyber-primary text-black shadow-lg shadow-cyber-primary/25 hover:bg-cyber-primary-hover'
            : 'cursor-not-allowed bg-cyber-outline/20 text-cyber-outline/50'
        }`}
      >
        Apply Filters
      </button>

      {(hasDraftFilters || hasSearch) ? (
        <button
          onClick={clearAll}
          className="w-full rounded border border-cyber-primary/30 p-2 text-sm font-medium uppercase tracking-widest text-cyber-primary transition-colors hover:text-cyber-primary-hover"
        >
          Clear Filters
        </button>
      ) : null}
    </div>
  );
}
