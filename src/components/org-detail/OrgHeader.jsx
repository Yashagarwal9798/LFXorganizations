import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export default function OrgHeader({ org }) {
  return (
    <div>
      <nav className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white">{org.displayName}</span>
      </nav>

      <div className="flex items-start gap-4">
        <div
          className="h-16 w-16 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: org.color && org.color !== 'FFFFFF' ? `#${org.color.replace('#', '')}` : '#E5E7EB',
          }}
        >
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={`${org.displayName} logo`} className="h-full w-full object-contain p-2" />
          ) : (
            <span className="text-2xl font-bold text-white">{org.displayName.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {org.displayName}
            </h1>
            <Badge variant="foundation">{org.foundation}</Badge>
          </div>

          {org.name !== org.displayName && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{org.name}</p>
          )}

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
            {org.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            {org.websiteUrl && (
              <a
                href={org.websiteUrl.startsWith('http') ? org.websiteUrl : `https://${org.websiteUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Website
              </a>
            )}
            {org.repoLink && (
              <a
                href={org.repoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Repository
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
