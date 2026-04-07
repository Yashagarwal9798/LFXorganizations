import { FOUNDATION_COLORS } from '@/lib/constants';

export default function Badge({ children, variant = 'default', color }) {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono tracking-wider items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full';

  if (variant === 'foundation') {
    const bg = color || FOUNDATION_COLORS[children] || '#6B7280';
    return (
      <span
        className={`${baseClasses} text-white bg-opacity-20 border border-opacity-40`}
        style={{ backgroundColor: `${bg}33`, borderColor: bg, color: bg }}
      >
        {children}
      </span>
    );
  }

  if (variant === 'season') {
    const seasonColors = {
      spring: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
      summer: 'bg-amber-900/30 text-amber-400 border-amber-500/30',
      fall: 'bg-orange-900/30 text-orange-400 border-orange-500/30',
    };
    return (
      <span className={`${baseClasses} border ${seasonColors[(children || '').toLowerCase()] || 'bg-cyber-surface-high border-cyber-outline/40 text-cyber-fg'}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`${baseClasses} bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20`}>
      {children}
    </span>
  );
}

