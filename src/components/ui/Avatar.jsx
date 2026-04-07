export default function Avatar({ src, name, size = 'md' }) {
  const sizes = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={`${sizes[size]} rounded-full object-cover border border-cyber-outline/30`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center font-mono font-bold text-cyber-primary`}
    >
      {initials}
    </div>
  );
}

