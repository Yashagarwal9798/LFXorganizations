'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import ComboBox from '@/components/ui/ComboBox';
import TermPicker from '@/components/ui/TermPicker';

export default function FilterBar({ meta }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const applied = useMemo(() => {
    const skillParam = searchParams.get('skills') || '';
    const yearsParam = searchParams.get('years') || '';
    const termsParam = searchParams.get('terms') || '';
    // Legacy single-value fallbacks
    const legacySeason = searchParams.get('season') || '';

    return {
      years: yearsParam ? yearsParam.split(',').map((y) => y.trim()).filter(Boolean) : [],
      terms: termsParam ? termsParam.split(',').map((t) => t.trim()).filter(Boolean) : [],
      season: legacySeason,
      foundation: searchParams.get('foundation') || '',
      skills: skillParam ? skillParam.split(',').map((skill) => skill.trim()).filter(Boolean) : [],
    };
  }, [searchParams]);

  const [draft, setDraft] = useState(applied);
  const [termPickerOpen, setTermPickerOpen] = useState(false);

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

  // When years change, clear terms that no longer belong to a selected year
  function handleYearsChange(newYears) {
    setDraft((prev) => {
      const yearSet = new Set(newYears);
      const validTerms = prev.terms.filter((t) => {
        const year = t.split(':')[0];
        return yearSet.has(year);
      });
      return { ...prev, years: newYears, terms: validTerms };
    });
  }

  const isDirty =
    draft.years.join(',') !== applied.years.join(',') ||
    draft.terms.join(',') !== applied.terms.join(',') ||
    draft.season !== applied.season ||
    draft.foundation !== applied.foundation ||
    draft.skills.join(',') !== applied.skills.join(',');

  const hasDraftFilters =
    draft.years.length > 0 || draft.terms.length > 0 || draft.season || draft.foundation || draft.skills.length > 0;
  const hasSearch = searchParams.get('search') || '';

  function applyFilters() {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');

    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    if (draft.years.length > 0) params.set('years', draft.years.join(','));
    if (draft.terms.length > 0) params.set('terms', draft.terms.join(','));
    // If no years selected, use the simple season dropdown value
    if (draft.years.length === 0 && draft.season) params.set('season', draft.season);
    if (draft.foundation) params.set('foundation', draft.foundation);
    if (draft.skills.length > 0) params.set('skills', draft.skills.join(','));

    replaceParams(params);
  }

  function clearAll() {
    setDraft({ years: [], terms: [], season: '', foundation: '', skills: [] });

    const params = new URLSearchParams();
    const sort = searchParams.get('sort');

    if (sort) params.set('sort', sort);

    replaceParams(params);
  }

  // Build year options for the multi-select ComboBox
  const yearOptions = useMemo(
    () => meta.years.map((year) => ({ value: String(year), label: String(year) })),
    [meta.years]
  );

  // Build human-readable chips for selected terms
  const termChips = useMemo(() => {
    return draft.terms.map((t) => {
      const [year, season] = t.split(':');
      const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1);
      return { value: t, label: `${seasonLabel} ${year}` };
    });
  }, [draft.terms]);

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <SearchInput value={hasSearch} onChange={updateSearch} />
      </div>

      <div className="space-y-4">
        {/* Multi-Year ComboBox */}
        <ComboBox
          label="Year"
          value={draft.years}
          onChange={(val) => handleYearsChange(val || [])}
          options={yearOptions}
          placeholder="All Years"
        />

        {/* Conditional Term Selector */}
        {draft.years.length > 0 ? (
          /* Years are selected → show a trigger button that opens TermPicker modal */
          <div>
            <label className="block text-xs font-mono tracking-widest uppercase text-cyber-fg-muted mb-2">
              Term / Season
            </label>
            <button
              onClick={() => setTermPickerOpen(true)}
              className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg bg-cyber-surface-lowest text-sm cursor-pointer shadow-inner transition-colors min-h-[42px] ${
                draft.terms.length > 0
                  ? 'border-cyber-primary/50 hover:border-cyber-primary'
                  : 'border-cyber-outline/30 hover:border-cyber-outline/50'
              }`}
            >
              <div className="flex-1 flex flex-wrap items-center gap-1 min-w-0">
                {termChips.length > 0 ? (
                  <>
                    {termChips.slice(0, 2).map((chip) => (
                      <span
                        key={chip.value}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-primary/15 text-cyber-primary text-xs font-mono max-w-[130px] truncate"
                      >
                        <span className="truncate">{chip.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = draft.terms.filter((v) => v !== chip.value);
                            updateDraft('terms', next);
                          }}
                          className="hover:text-white flex-shrink-0"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    {termChips.length > 2 && (
                      <span className="text-[10px] font-mono text-cyber-outline">
                        +{termChips.length - 2} more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-white/70">Pick terms for selected years…</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 pl-2 flex-shrink-0">
                {draft.terms.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateDraft('terms', []);
                    }}
                    className="p-0.5 rounded hover:bg-cyber-outline/20 text-cyber-outline hover:text-cyber-fg transition-colors"
                    title="Clear terms"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <svg className="h-4 w-4 text-cyber-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
            </button>
            <TermPicker
              open={termPickerOpen}
              onClose={() => setTermPickerOpen(false)}
              years={draft.years}
              value={draft.terms}
              onChange={(val) => updateDraft('terms', val)}
            />
          </div>
        ) : (
          /* No years selected → simple season dropdown like before */
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
        )}

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
