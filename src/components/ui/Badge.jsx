import { FOUNDATION_COLORS } from '@/lib/constants';

export default function Badge({ children, variant = 'default', color }) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  if (variant === 'foundation') {
    const bg = color || FOUNDATION_COLORS[children] || '#6B7280';
    return (
      <span
        className={`${baseClasses} text-white`}
        style={{ backgroundColor: bg }}
      >
        {children}
      </span>
    );
  }

  if (variant === 'season') {
    const seasonColors = {
      spring: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      summer: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      fall: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return (
      <span className={`${baseClasses} ${seasonColors[children] || 'bg-gray-100 text-gray-800'}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>
      {children}
    </span>
  );
}
