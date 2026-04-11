'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

const SEASONS = [
  { value: 'spring', label: 'Spring', icon: '🌱' },
  { value: 'summer', label: 'Summer', icon: '☀️' },
  { value: 'fall', label: 'Fall', icon: '🍂' },
];

/**
 * TermPicker modal — shows each selected year as a section header
 * with Spring / Summer / Fall toggles beneath it.
 *
 * Props:
 *   open        — boolean
 *   onClose     — () => void
 *   years       — string[]  e.g. ["2024", "2025"]
 *   value       — string[]  e.g. ["2024:fall", "2025:summer"]
 *   onChange     — (nextValue: string[]) => void
 */
export default function TermPicker({ open, onClose, years, value = [], onChange }) {
  const [localValue, setLocalValue] = useState(value);

  // Sync when opened
  const effectiveValue = open ? localValue : value;

  function handleOpen() {
    setLocalValue(value);
  }

  // Toggle a single year:season pair
  function toggle(year, season) {
    const key = `${year}:${season}`;
    setLocalValue((prev) => {
      if (prev.includes(key)) {
        return prev.filter((v) => v !== key);
      }
      return [...prev, key];
    });
  }

  // Toggle all seasons for a year
  function toggleYear(year) {
    setLocalValue((prev) => {
      const yearKeys = SEASONS.map((s) => `${year}:${s.value}`);
      const allSelected = yearKeys.every((k) => prev.includes(k));
      if (allSelected) {
        return prev.filter((v) => !yearKeys.includes(v));
      }
      const existing = new Set(prev);
      yearKeys.forEach((k) => existing.add(k));
      return [...existing];
    });
  }

  function handleDone() {
    onChange(localValue);
    onClose();
  }

  function handleClear() {
    setLocalValue([]);
  }

  // Sort years descending (most recent first)
  const sortedYears = [...years].sort((a, b) => Number(b) - Number(a));

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-8"
      onClick={() => { onChange(localValue); onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-cyber-bg border border-cyber-outline/30 rounded-2xl shadow-2xl shadow-cyber-primary/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-cyber-outline/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-cyber-fg">
                Select Terms
              </h2>
              <p className="text-xs font-mono text-cyber-fg-muted mt-1">
                Pick specific terms for each year
              </p>
            </div>
            <button
              onClick={() => { onChange(localValue); onClose(); }}
              className="p-1.5 rounded-lg hover:bg-cyber-surface-low text-cyber-outline hover:text-cyber-fg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
          {sortedYears.map((year) => {
            const yearKeys = SEASONS.map((s) => `${year}:${s.value}`);
            const selectedCount = yearKeys.filter((k) => localValue.includes(k)).length;
            const allSelected = selectedCount === SEASONS.length;

            return (
              <div key={year} className="group">
                {/* Year Header */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => toggleYear(year)}
                    className="flex items-center gap-2 group/header"
                  >
                    <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                      allSelected
                        ? 'border-cyber-primary bg-cyber-primary/30 text-cyber-primary'
                        : selectedCount > 0
                          ? 'border-cyber-primary/60 bg-cyber-primary/10 text-cyber-primary'
                          : 'border-cyber-outline/40'
                    }`}>
                      {allSelected ? '✓' : selectedCount > 0 ? '–' : ''}
                    </span>
                    <span className="text-lg font-display font-bold text-cyber-fg group-hover/header:text-cyber-primary transition-colors">
                      {year}
                    </span>
                  </button>
                  {selectedCount > 0 && (
                    <span className="text-[10px] font-mono text-cyber-primary bg-cyber-primary/15 px-2 py-0.5 rounded-full">
                      {selectedCount}/{SEASONS.length}
                    </span>
                  )}
                  <div className="flex-1 h-px bg-cyber-outline/15"></div>
                </div>

                {/* Season Toggles */}
                <div className="grid grid-cols-3 gap-2 pl-6">
                  {SEASONS.map((season) => {
                    const key = `${year}:${season.value}`;
                    const isSelected = localValue.includes(key);

                    return (
                      <button
                        key={key}
                        onClick={() => toggle(year, season.value)}
                        className={`relative flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'border-cyber-primary bg-cyber-primary/10 text-cyber-primary shadow-lg shadow-cyber-primary/10'
                            : 'border-cyber-outline/20 bg-cyber-surface-low/50 text-cyber-fg-muted hover:border-cyber-outline/40 hover:bg-cyber-surface-low hover:text-cyber-fg'
                        }`}
                      >
                        <span className="text-lg">{season.icon}</span>
                        <span className="font-mono text-xs tracking-wider uppercase">{season.label}</span>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cyber-outline/20 flex items-center justify-between bg-cyber-surface-lowest">
          <div className="text-xs font-mono text-cyber-outline">
            {localValue.length} term{localValue.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            {localValue.length > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-2 text-xs font-mono text-cyber-fg-muted hover:text-cyber-fg border border-cyber-outline/30 rounded-lg hover:bg-cyber-surface-low transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={handleDone}
              className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-cyber-primary to-cyber-secondary text-cyber-bg rounded-lg shadow-[0_0_16px_rgba(0,209,255,0.3)] hover:shadow-[0_0_24px_rgba(0,209,255,0.5)] transition-all flex items-center gap-2"
            >
              Done
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
