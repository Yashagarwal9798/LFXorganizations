'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <div className="bg-glass-card shadow-2xl shadow-cyber-primary/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      <div className="text-5xl font-display font-bold text-cyber-fg tracking-tight text-gradient">
        {count.toLocaleString()}+
      </div>
      <div className="mt-3 text-sm tracking-wider font-medium text-cyber-fg-muted uppercase">
        {label}
      </div>
    </div>
  );
}

export default function HeroSection({ meta }) {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyber-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="text-center relative z-10 px-4">
        <h1 className="text-5xl font-display font-bold tracking-tighter text-white sm:text-7xl">
          The Future of <br className="sm:hidden" />
          <span className="text-gradient">Open Source</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-cyber-fg-muted font-mono leading-relaxed">
          Explore the Linux Foundation Mentorship ecosystem. Join 500+ top-tier
          organizations building the infrastructure of the internet.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link href="/organizations" className="bg-gradient-to-r from-cyber-primary to-cyber-secondary hover:from-cyber-primary-hover hover:to-cyber-primary text-cyber-bg font-bold py-3 px-8 rounded-lg shadow-[0_0_24px_rgba(0,209,255,0.4)] transition-all duration-300">
            Start Your Journey
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8 lg:px-12 relative z-10">
        <AnimatedCounter end={meta.totalOrganizations} label="Organizations" />
        <AnimatedCounter end={meta.totalMentees} label="Mentees Graduated" />
        <AnimatedCounter end={meta.totalProjects} label="Projects" /> 
        {/* Switched totalProjects label temporarily to reflect scale, or keep 'Projects' */}
      </div>
    </section>
  );
}

