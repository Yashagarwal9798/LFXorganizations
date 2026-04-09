'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import ComboBox from '@/components/ui/ComboBox';

export default function FilterBar({ meta }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Read current applied filters from URL ──
  function readFromURL() {
    const skillParam = searchParams.get('skills') || '';
    return {
      year: searchParams.get('year') || '',
      season: searchParams.get('season') || '',
      foundation: searchParams.get('foundation') || '',
      skills: skillParam ? skillParam.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
  }

  // Draft state for filters that need "Apply" (everything except search)
  const [draft, setDraft] = useState(readFromURL);

  // Sync draft when URL changes externally (browser back/forward)
  useEffect(() => {
    setDraft(readFromURL());
  }, [searchParams]);

  function updateDraft(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  // ── Search stays INSTANT (updates URL immediately) ──
  function updateSearch(value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // ── Check if draft differs from applied URL params ──
  const applied = readFromURL();
  const isDirty =
    draft.year !== applied.year ||
    draft.season !== applied.season ||
    draft.foundation !== applied.foundation ||
    draft.skills.join(',') !== applied.skills.join(',');

  const hasDraftFilters =
    draft.year || draft.season || draft.foundation || draft.skills.length > 0;
  const hasSearch = searchParams.get('search') || '';

  // ── Apply: push draft filters to URL ──
  function applyFilters() {
    const params = new URLSearchParams();
    // Preserve search
    const search = searchParams.get('search');
    if (search) params.set('search', search);
    // Preserve sort
    const sort = searchParams.get('sort');
    if (sort) params.set('sort', sort);
    // Apply draft filters
    if (draft.year) params.set('year', draft.year);
    if (draft.season) params.set('season', draft.season);
    if (draft.foundation) params.set('foundation', draft.foundation);
    if (draft.skills.length > 0) params.set('skills', draft.skills.join(','));
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    setDraft({ year: '', season: '', foundation: '', skills: [] });
    // Clear everything except sort
    const params = new URLSearchParams();
    const sort = searchParams.get('sort');
    if (sort) params.set('sort', sort);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      {/* Search — stays instant */}
      <div className="mb-6">
        <SearchInput
          value={hasSearch}
          onChange={updateSearch}
        />
      </div>

      {/* Filters that require "Apply" */}
      <div className="space-y-4">
        <Select
          label="Year"
          value={draft.year}
          onChange={(val) => updateDraft('year', val || '')}
          options={meta.years.map((y) => ({ value: String(y), label: String(y) }))}
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

      {/* Apply Filters button — glows when draft has pending changes */}
      <button
        onClick={applyFilters}
        disabled={!isDirty}
        className={`mt-6 w-full text-sm font-bold py-3 rounded-lg uppercase tracking-widest transition-all duration-300 ${
          isDirty
            ? 'bg-cyber-primary text-black hover:bg-cyber-primary-hover shadow-lg shadow-cyber-primary/25 cursor-pointer'
            : 'bg-cyber-outline/20 text-cyber-outline/50 cursor-not-allowed'
        }`}
      >
        {isDirty ? '⚡ Apply Filters' : 'Apply Filters'}
      </button>

      {(hasDraftFilters || hasSearch) && (
        <button
          onClick={clearAll}
          className="w-full text-sm font-medium text-cyber-primary hover:text-cyber-primary-hover border border-cyber-primary/30 rounded p-2 transition-colors uppercase tracking-widest"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
