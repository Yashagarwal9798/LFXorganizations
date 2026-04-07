export default function Select({ value, onChange, options, placeholder, label }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-mono tracking-widest uppercase text-cyber-fg-muted mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2.5 border border-cyber-outline/30 rounded-lg bg-cyber-surface-lowest text-sm text-cyber-fg focus:outline-none focus:ring-1 focus:ring-cyber-primary focus:border-cyber-primary appearance-none cursor-pointer shadow-inner"
        >
          <option value="" className="bg-[#0f131d] text-white">{placeholder || 'All'}</option>
          {options.map((opt) => (
            <option 
              key={typeof opt === 'string' ? opt : opt.value} 
              value={typeof opt === 'string' ? opt : opt.value}
              className="bg-[#0f131d] text-white"
            >
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-cyber-outline">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

