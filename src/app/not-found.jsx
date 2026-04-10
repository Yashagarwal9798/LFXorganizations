import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Big 404 */}
        <h1 className="text-8xl sm:text-9xl font-extrabold text-gradient tracking-tight mb-4 font-display">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-cyber-fg mb-3">
          Page not found
        </h2>

        <p className="text-cyber-fg-muted text-base leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg border border-cyber-primary/40 bg-cyber-primary/10 text-cyber-primary font-semibold text-sm hover:bg-cyber-primary/20 hover:border-cyber-primary/60 transition-all duration-200"
          >
            Back to Home
          </Link>

          <Link
            href="/organizations"
            className="px-6 py-3 rounded-lg border border-cyber-outline/30 bg-cyber-surface text-cyber-fg-muted font-semibold text-sm hover:border-cyber-primary/30 hover:text-cyber-fg transition-all duration-200"
          >
            Browse Organizations
          </Link>
        </div>
      </div>
    </div>
  );
}
