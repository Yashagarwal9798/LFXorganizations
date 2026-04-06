'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';

export default function FilterBar({ meta }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = {
    search: searchParams.get('search') || '',
    year: searchParams.get('year') || '',
    season: searchParams.get('season') || '',
    foundation: searchParams.get('foundation') || '',
    skill: searchParams.get('skill') || '',
  };

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    router.replace('/', { scroll: false });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-3">
      <SearchInput
        value={filters.search}
        onChange={(val) => updateParam('search', val)}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={filters.year}
          onChange={(val) => updateParam('year', val)}
          options={meta.years.map((y) => ({ value: String(y), label: String(y) }))}
          placeholder="All Years"
        />
        <Select
          value={filters.season}
          onChange={(val) => updateParam('season', val)}
          options={[
            { value: 'spring', label: 'Spring' },
            { value: 'summer', label: 'Summer' },
            { value: 'fall', label: 'Fall' },
          ]}
          placeholder="All Terms"
        />
        <Select
          value={filters.foundation}
          onChange={(val) => updateParam('foundation', val)}
          options={meta.foundations}
          placeholder="All Foundations"
        />
        <Select
          value={filters.skill}
          onChange={(val) => updateParam('skill', val)}
          options={meta.skills.slice(0, 50)}
          placeholder="All Skills"
        />
      </div>
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
