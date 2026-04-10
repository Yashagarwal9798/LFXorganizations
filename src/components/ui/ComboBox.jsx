'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function ComboBox({ value = [], onChange, options, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);
  const inputRef = useRef(null);
  const modalSearchRef = useRef(null);
  const [portalPos, setPortalPos] = useState(null);

  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const normalizedOptions = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      ),
    [options]
  );

  const filtered = useMemo(() => {
    if (!search) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, search]);

  const modalFiltered = useMemo(() => {
    if (!modalSearch) return normalizedOptions;
    const q = modalSearch.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, modalSearch]);

  // Update portal position
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function update() {
      const rect = triggerRef.current.getBoundingClientRect();
      setPortalPos({
        bottom: window.innerHeight - rect.bottom,
        left: rect.right + 8,
        width: Math.max(300, rect.width),
      });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      const inContainer = containerRef.current?.contains(e.target);
      const inPortal = portalRef.current?.contains(e.target);
      if (!inContainer && !inPortal) {
        setOpen(false);
        setSearch('');
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  // Focus modal search when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => modalSearchRef.current?.focus(), 50);
    }
  }, [modalOpen]);

  function toggleOption(optValue) {
    if (selected.includes(optValue)) {
      const next = selected.filter((v) => v !== optValue);
      onChange(next.length > 0 ? next : []);
    } else {
      onChange([...selected, optValue]);
    }
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function toggleOptionModal(optValue) {
    if (selected.includes(optValue)) {
      const next = selected.filter((v) => v !== optValue);
      onChange(next.length > 0 ? next : []);
    } else {
      onChange([...selected, optValue]);
    }
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange([]);
    setSearch('');
    setOpen(false);
  }

  function removeTag(e, val) {
    e.stopPropagation();
    const next = selected.filter((v) => v !== val);
    onChange(next.length > 0 ? next : []);
  }

  const selectedLabels = selected.map(
    (v) => normalizedOptions.find((o) => o.value === v)?.label || v
  );

  return (
    <div ref={containerRef}>
      {label && (
        <label className="block text-xs font-mono tracking-widest uppercase text-cyber-fg-muted mb-2">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        ref={triggerRef}
        className={`flex items-center w-full border rounded-lg bg-cyber-surface-lowest text-sm cursor-pointer shadow-inner transition-colors min-h-[42px] ${
          open
            ? 'border-cyber-primary ring-1 ring-cyber-primary'
            : 'border-cyber-outline/30 hover:border-cyber-outline/50'
        }`}
        onClick={() => {
          if (!open) {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1 px-2 py-1.5 min-w-0">
          {selected.length > 0 && !open && (
            <>
              {selectedLabels.slice(0, 2).map((lbl, i) => (
                <span
                  key={selected[i]}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyber-primary/15 text-cyber-primary text-xs font-mono max-w-[130px] truncate"
                >
                  <span className="truncate">{lbl}</span>
                  <button
                    onClick={(e) => removeTag(e, selected[i])}
                    className="hover:text-white flex-shrink-0"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {selected.length > 2 && (
                <span className="text-[10px] font-mono text-cyber-outline">
                  +{selected.length - 2} more
                </span>
              )}
            </>
          )}

          {open ? (
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={selected.length > 0 ? `${selected.length} selected — search…` : 'Search skills…'}
              className="flex-1 min-w-[80px] bg-transparent text-cyber-fg outline-none placeholder:text-cyber-outline/60 text-sm px-1 py-1"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                  setSearch('');
                }
                if (e.key === 'Backspace' && !search && selected.length > 0) {
                  const next = selected.slice(0, -1);
                  onChange(next.length > 0 ? next : []);
                }
              }}
            />
          ) : (
            selected.length === 0 && (
              <span className="text-white/70 px-1 py-1">{placeholder || 'All'}</span>
            )
          )}
        </div>

        <div className="flex items-center pr-2 gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <button
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-cyber-outline/20 text-cyber-outline hover:text-cyber-fg transition-colors"
              title="Clear all"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <div className="pointer-events-none text-cyber-outline">
            <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown portal */}
      {open && portalPos && createPortal(
        <div
          ref={portalRef}
          className="fixed z-[9999] rounded-lg border border-cyber-outline/30 bg-[#0f131d] shadow-xl shadow-black/40 flex flex-col"
          style={{
            bottom: portalPos.bottom,
            left: portalPos.left,
            width: portalPos.width,
            maxHeight: '20rem',
          }}
        >
          {/* Scrollable options area */}
          <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin' }}>
            {selected.length > 0 && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange([]); setSearch(''); }}
                className="w-full text-left px-3 py-2 text-sm text-cyber-fg-muted hover:bg-cyber-surface-low hover:text-cyber-fg border-b border-cyber-outline/10 font-mono text-xs"
              >
                ✕ Clear all ({selected.length} selected)
              </button>
            )}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-cyber-outline font-mono">
                No skills match &ldquo;{search}&rdquo;
              </div>
            )}

            {filtered.slice(0, 50).map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleOption(opt.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                    isSelected
                      ? 'bg-cyber-primary/15 text-cyber-primary'
                      : 'text-white/80 hover:bg-cyber-surface-low hover:text-white'
                  }`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                    isSelected
                      ? 'border-cyber-primary bg-cyber-primary/30 text-cyber-primary'
                      : 'border-cyber-outline/40'
                  }`}>
                    {isSelected && '✓'}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* View All button — pinned outside scroll area */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen(false);
              setSearch('');
              setModalOpen(true);
            }}
            className="w-full px-3 py-2.5 text-xs font-mono text-cyber-primary hover:bg-cyber-primary/10 border-t border-cyber-outline/20 flex items-center justify-center gap-2 transition-colors flex-shrink-0 bg-[#0f131d] rounded-b-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            View All {normalizedOptions.length} Skills
          </button>
        </div>,
        document.body
      )}

      {/* Full-screen Skills Modal */}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-8"
          onClick={() => { setModalOpen(false); setModalSearch(''); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-3xl max-h-[85vh] bg-cyber-bg border border-cyber-outline/30 rounded-2xl shadow-2xl shadow-cyber-primary/10 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-cyber-outline/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold text-cyber-fg">
                  Filter by Skills
                </h2>
                <button
                  onClick={() => { setModalOpen(false); setModalSearch(''); }}
                  className="p-1.5 rounded-lg hover:bg-cyber-surface-low text-cyber-outline hover:text-cyber-fg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={modalSearchRef}
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cyber-surface-lowest border border-cyber-outline/30 rounded-lg text-sm text-cyber-fg placeholder:text-cyber-outline/50 outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-colors"
                />
                {selected.length > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyber-primary bg-cyber-primary/15 px-2 py-0.5 rounded-full">
                    {selected.length} selected
                  </span>
                )}
              </div>
            </div>

            {/* Skills Grid */}
            <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
              {modalFiltered.length === 0 ? (
                <div className="text-center text-sm text-cyber-outline font-mono py-12">
                  No skills match &ldquo;{modalSearch}&rdquo;
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  {modalFiltered.map((opt) => {
                    const isSelected = selected.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleOptionModal(opt.value)}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-cyber-primary/15 text-cyber-primary'
                            : 'text-white/70 hover:bg-cyber-surface-low hover:text-white'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                          isSelected
                            ? 'border-cyber-primary bg-cyber-primary/30 text-cyber-primary'
                            : 'border-cyber-outline/40'
                        }`}>
                          {isSelected && '✓'}
                        </span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-cyber-outline/20 flex items-center justify-between bg-cyber-surface-lowest">
              <div className="text-xs font-mono text-cyber-outline">
                {modalFiltered.length} skills{selected.length > 0 && ` · ${selected.length} selected`}
              </div>
              <div className="flex items-center gap-3">
                {selected.length > 0 && (
                  <button
                    onClick={() => onChange([])}
                    className="px-4 py-2 text-xs font-mono text-cyber-fg-muted hover:text-cyber-fg border border-cyber-outline/30 rounded-lg hover:bg-cyber-surface-low transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => { setModalOpen(false); setModalSearch(''); }}
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
      )}
    </div>
  );
}
