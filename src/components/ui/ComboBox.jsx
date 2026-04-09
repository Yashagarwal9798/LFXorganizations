'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

export default function ComboBox({ value = [], onChange, options, placeholder, label }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);
  const inputRef = useRef(null);
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

  // Update portal position
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function update() {
      const rect = triggerRef.current.getBoundingClientRect();
      // Right side of the trigger, bottom-aligned (grows upward)
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

  // Close on outside click — check both container AND portal
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
    // Use setTimeout so the listener doesn't catch the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

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

      {/* Dropdown portal — right side, bottom-aligned, grows upward */}
      {open && portalPos && createPortal(
        <div
          ref={portalRef}
          className="fixed z-[9999] max-h-80 overflow-y-auto rounded-lg border border-cyber-outline/30 bg-[#0f131d] shadow-xl shadow-black/40"
          style={{
            bottom: portalPos.bottom,
            left: portalPos.left,
            width: portalPos.width,
            scrollbarWidth: 'thin',
          }}
        >
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

          {filtered.map((opt) => {
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

          {search && filtered.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] font-mono text-cyber-outline border-t border-cyber-outline/10 bg-cyber-surface-lowest sticky bottom-0">
              {filtered.length} / {normalizedOptions.length} skills
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
