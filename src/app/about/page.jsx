import { LFX_BASE_URL } from '@/lib/constants';

export const metadata = {
  title: 'About — LFX Mentorship Organizations',
  description: 'Learn about the LFX Mentorship program and how this directory works.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        About This Site
      </h1>

      <div className="mt-6 space-y-6 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <p>
          This is an unofficial, community-built directory of all organizations
          participating in the{' '}
          <a
            href={LFX_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            LFX Mentorship
          </a>{' '}
          program, run by the Linux Foundation.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white pt-4">
          What is LFX Mentorship?
        </h2>
        <p>
          LFX Mentorship connects aspiring open source developers with experienced
          mentors across Linux Foundation projects. Mentees work on real-world
          projects for organizations like CNCF, Hyperledger, LF AI & Data, OpenSSF,
          and more.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white pt-4">
          Program Terms
        </h2>
        <p>LFX runs 3 mentorship terms per year:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Spring</strong> (March – May) — Applications open mid-January</li>
          <li><strong>Summer</strong> (June – August) — Applications open mid-April</li>
          <li><strong>Fall</strong> (September – November) — Applications open mid-July</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white pt-4">
          Data Source
        </h2>
        <p>
          All data is fetched from the public LFX Mentorship API and refreshed
          weekly. We display organizations and projects from 2021 onward.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white pt-4">
          Report an Issue
        </h2>
        <p>
          Found incorrect data or have a suggestion? Please open an issue on our{' '}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            GitHub repository
          </a>
          .
        </p>
      </div>
    </div>
  );
}
