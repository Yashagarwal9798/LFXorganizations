import { Geist } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { loadMeta } from '@/lib/data';

const geistSans = Geist({
  variable: '--font-geist-sans',
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
    lastUpdated = meta.lastUpdated;
  } catch {}

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer lastUpdated={lastUpdated} />
      </body>
    </html>
  );
}
