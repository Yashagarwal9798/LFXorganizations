'use client';

import { useState } from 'react';

const pxSizes = { sm: 24, md: 32, lg: 40 };
const cssSizes = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export default function Avatar({ src, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || ''}
        width={pxSizes[size]}
        height={pxSizes[size]}
        loading="lazy"
        decoding="async"
        className={`${cssSizes[size]} rounded-full object-cover border border-cyber-outline/30`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${cssSizes[size]} rounded-full bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center font-mono font-bold text-cyber-primary`}
    >
      {initials}
    </div>
  );
}
