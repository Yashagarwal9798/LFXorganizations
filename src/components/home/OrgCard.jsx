import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export default function OrgCard({ org }) {
  const maxSkills = 3;
  const visibleSkills = org.skills.slice(0, maxSkills);
  const extraCount = org.skills.length - maxSkills;

  return (
    <Link
      href={`/organizations/${org.slug}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: org.color && org.color !== 'FFFFFF' ? `#${org.color.replace('#', '')}` : '#E5E7EB',
          }}
        >
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={`${org.displayName} logo`}
              className="h-full w-full object-contain p-1"
            />
          ) : (
            <span className="text-lg font-bold text-white">
              {org.displayName.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {org.displayName}
            </h3>
            <Badge variant="foundation">{org.foundation}</Badge>
          </div>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {org.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {visibleSkills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {extraCount > 0 && <Badge>+{extraCount} more</Badge>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {org.participations.slice(-6).map((p) => (
          <span
            key={p.term.label}
            className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {p.term.label}
          </span>
        ))}
        {org.participations.length > 6 && (
          <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            +{org.participations.length - 6} more
          </span>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {org.totalProjects} projects &middot; {org.totalMentees} mentees graduated
      </div>
    </Link>
  );
}
