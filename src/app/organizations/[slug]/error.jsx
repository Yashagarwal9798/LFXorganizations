'use client';

import Link from 'next/link';

export default function OrgDetailError({ error, reset }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6 animate-bounce">📋</div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-3">
          Couldn&apos;t load this organization
        </h1>

        <p className="text-cyber-fg-muted text-base leading-relaxed mb-8">
          We had trouble loading the organization details. The organization
          may not exist or there could be a temporary issue. Please try again.
        </p>

        {error?.message && (
          <div className="mb-8 rounded-lg bg-cyber-surface border border-cyber-outline/20 px-4 py-3 text-left">
            <p className="text-xs text-cyber-fg-muted font-mono truncate">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-lg border border-cyber-primary/40 bg-cyber-primary/10 text-cyber-primary font-semibold text-sm hover:bg-cyber-primary/20 hover:border-cyber-primary/60 transition-all duration-200 cursor-pointer"
          >
            Try Again
          </button>

          <Link
            href="/organizations"
            className="px-6 py-3 rounded-lg border border-cyber-outline/30 bg-cyber-surface text-cyber-fg-muted font-semibold text-sm hover:border-cyber-primary/30 hover:text-cyber-fg transition-all duration-200"
          >
            All Organizations
          </Link>
        </div>
      </div>
    </div>
  );
}
