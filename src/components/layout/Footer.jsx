import { LFX_BASE_URL } from '@/lib/constants';

export default function Footer({ lastUpdated }) {
  const dateStr = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <footer className="border-t border-cyber-outline/20 bg-cyber-surface-low text-cyber-fg-muted mt-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm">
            Data sourced from{' '}
            <a
              href={LFX_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-primary hover:text-cyber-secondary transition-colors"
            >
              LFX Mentorship
            </a>
            {' '}&middot; Last updated: {dateStr}
          </div>
          <div className="text-xs uppercase tracking-widest text-cyber-outline">
            Sys. Status: Online
          </div>
        </div>
      </div>
    </footer>
  );
}

