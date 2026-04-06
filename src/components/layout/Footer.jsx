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
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Data sourced from{' '}
            <a
              href={LFX_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              LFX Mentorship
            </a>
            {' '}&middot; Last updated: {dateStr}
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500">
            Not affiliated with the Linux Foundation
          </div>
        </div>
      </div>
    </footer>
  );
}
