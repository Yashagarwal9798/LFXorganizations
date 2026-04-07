import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { loadMeta } from '@/lib/data';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

export const metadata = {
  title: 'LFX Mentorship Organizations',
  description:
    'Browse all organizations participating in the Linux Foundation Mentorship program. Filter by year, term, foundation, and skills.',
};

export default async function RootLayout({ children }) {
  let lastUpdated = null;
  try {
    const meta = await loadMeta();
    lastUpdated = lastUpdated = meta?.lastUpdated || null;
  } catch {}

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} dark h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-cyber-bg text-cyber-fg font-sans selection:bg-cyber-primary/30">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer lastUpdated={lastUpdated} />
      </body>
    </html>
  );
}
