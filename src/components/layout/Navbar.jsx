import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-glass text-cyber-fg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-display font-bold text-cyber-fg group-hover:text-cyber-primary transition-colors duration-300">
              LFX Organizations
            </span>
            <span className="hidden sm:inline text-sm text-cyber-fg-muted font-mono tracking-wider">
              [OBSERVATORY]
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-cyber-fg-muted hover:text-cyber-primary transition-colors"
            >
              Explorer
            </Link>
            <Link
              href="/organizations"
              className="text-sm font-medium text-cyber-fg-muted hover:text-cyber-primary transition-colors"
            >
              Directory
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-cyber-fg-muted hover:text-cyber-primary transition-colors"
            >
              Manifesto
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

