import { loadMeta } from '@/lib/data';
import HeroSection from '@/components/home/HeroSection';

export default async function HomePage() {
  const meta = await loadMeta();

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
      <HeroSection meta={meta} />
    </div>
  );
}


