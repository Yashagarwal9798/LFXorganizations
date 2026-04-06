'use client';

import { useEffect, useState } from 'react';

function AnimatedCounter({ end, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) return;
    const duration = 1500;
    const steps = 40;
    const increment = end / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [end]);

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
        {count.toLocaleString()}
      </div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export default function HeroSection({ meta }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          LFX Mentorship Organizations
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Explore all organizations participating in the Linux Foundation
          Mentorship program. Filter by year, term, foundation, and skills.
        </p>
      </div>

      <div className="mt-10 flex justify-center gap-8 sm:gap-16">
        <AnimatedCounter end={meta.totalOrganizations} label="Organizations" />
        <AnimatedCounter end={meta.totalProjects} label="Projects" />
        <AnimatedCounter end={meta.totalMentees} label="Mentees Graduated" />
      </div>
    </section>
  );
}
