import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export default function OrgHeader({ org }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-cyber-bg border border-cyber-outline/20 p-8 pt-12 mt-8 z-10 group">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 blur-3xl pointer-events-none transition-opacity duration-1000 group-hover:opacity-20"
        style={{
          backgroundColor: org.color && org.color !== 'FFFFFF' ? `#${org.color.replace('#', '')}` : '#00d1ff',
        }}
      ></div>

      <nav className="absolute top-4 left-6 text-xs font-mono uppercase tracking-widest text-cyber-fg-muted">
        <Link href="/" className="hover:text-cyber-primary transition-colors">
          Home
        </Link>
        <span className="mx-2 text-cyber-outline">/</span>
        <span className="text-cyber-fg">{org.displayName}</span>
      </nav>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 relative z-10">
        <div
          className="h-28 w-28 sm:h-36 sm:w-36 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-hidden bg-cyber-surface border-2 shadow-2xl backdrop-blur-md"
          style={{
            borderColor: org.color && org.color !== 'FFFFFF' ? `#${org.color.replace('#', '')}55` : 'rgba(60, 73, 78, 0.5)',
            boxShadow: org.color && org.color !== 'FFFFFF' ? `0 20px 40px -10px #${org.color.replace('#', '')}44` : '0 20px 40px -10px rgba(0,209,255,0.1)',
          }}
        >
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={`${org.displayName} logo`} className="h-full w-full object-contain p-4 drop-shadow-lg" />
          ) : (
            <span className="text-5xl font-display font-bold text-cyber-fg">{org.displayName.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 pb-2">
          <div className="flex items-center gap-4 flex-wrap mb-2">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-cyber-fg tracking-tight">
              {org.displayName}
            </h1>
            <Badge variant="foundation">{org.foundation}</Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 font-mono text-sm">
            {org.websiteUrl && (
              <a
                href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-cyber-primary hover:text-cyber-primary-hover transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                [WEBSITE]
              </a>
            )}
            {org.repoLink && (
              <a
                href={org.repoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-cyber-primary hover:text-cyber-primary-hover transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                [REPOSITORY]
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

