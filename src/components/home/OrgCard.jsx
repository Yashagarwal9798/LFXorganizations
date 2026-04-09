import { memo } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

const OrgCard = memo(function OrgCard({ org }) {
  const maxSkills = 3;
  const visibleSkills = (org.skills || []).slice(0, maxSkills);
  const extraCount = (org.skills || []).length - maxSkills;

  return (
    <Link
      href={`/organizations/${org.slug}`}
      className="group block rounded-xl bg-glass-card p-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div
          className="h-14 w-14 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden bg-cyber-surface-high border border-cyber-outline/20"
          style={{
            borderColor: org.color && org.color !== 'FFFFFF' ? `#${org.color.replace('#', '')}55` : '',
          }}
        >
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={`${org.displayName} logo`}
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="text-xl font-display font-bold text-cyber-fg">
              {org.displayName.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1 items-start">
            <h3 className="text-base font-display font-semibold text-cyber-fg truncate w-full group-hover:text-cyber-primary transition-colors">
              {org.displayName}
            </h3>
            <Badge variant="foundation">{org.foundation}</Badge>
          </div>
        </div>
      </div>
      
      {/* Activity Bar */}
      <div className="mt-5 grid border-t border-cyber-outline/20 border-b py-3 mb-3 grid-cols-2 gap-4">
          <div className="bg-cyber-surface-low rounded p-2 text-center border border-cyber-outline/10">
              <div className="font-mono text-lg font-bold text-cyber-secondary">{org.totalProjects}</div>
              <div className="text-[10px] uppercase tracking-widest text-cyber-fg-muted mt-1">Projects</div>
          </div>
          <div className="bg-cyber-surface-low rounded p-2 text-center border border-cyber-outline/10">
              <div className="font-mono text-lg font-bold text-cyber-primary">{org.totalMentees}</div>
              <div className="text-[10px] uppercase tracking-widest text-cyber-fg-muted mt-1">Mentees</div>
          </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 relative z-10">
        {visibleSkills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {extraCount > 0 && <Badge>+{extraCount}</Badge>}
      </div>
    </Link>
  );
}
);

export default OrgCard;
