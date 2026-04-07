'use client';

import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { LFX_BASE_URL } from '@/lib/constants';

export default function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);

  const mentorNames = project.mentors.map((m) => m.name).join(', ');
  const skillNames = project.skills.slice(0, 3).join(', ');
  const graduatedMentees = project.mentees.filter((m) => m.status === 'graduated');

  return (
    <div className="rounded-xl border border-cyber-outline/20 bg-cyber-bg hover:border-cyber-primary/40 transition-colors duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-4 p-5 text-left focus:outline-none"
      >
        <div className={`mt-0.5 text-cyber-primary transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M9 18l6-6-6-6" />
           </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-display font-medium text-cyber-fg">
            {project.title}
          </h4>
          <p className="mt-1 text-xs font-mono text-cyber-fg-muted truncate">
             {project.mentors.length > 0 && <span className="text-cyber-secondary mr-2">[{project.mentors.length} MENTOR{project.mentors.length !== 1 ? 'S' : ''}]</span>}
             {skillNames}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-cyber-outline/10 px-5 pb-5 pt-4 bg-cyber-surface-low rounded-b-xl">
          {project.description && (
            <p className="text-sm text-cyber-fg-muted leading-relaxed mb-4">
              {project.description}
            </p>
          )}

          {project.skills.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-mono tracking-widest uppercase text-cyber-outline mb-2">
                Tech Stack
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {project.mentors.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-mono tracking-widest uppercase text-cyber-outline mb-2">
                Mentors
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.mentors.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-cyber-bg border border-cyber-outline/10 rounded p-1.5 px-2">
                    <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                    <span className="text-sm text-cyber-fg truncate">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {graduatedMentees.length > 0 && (
            <div className="mb-4">
              <h5 className="text-[10px] font-mono tracking-widest uppercase text-cyber-outline mb-2">
                Graduated Mentees
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {graduatedMentees.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-cyber-bg border border-cyber-outline/10 rounded p-1.5 px-2">
                    <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-cyber-fg truncate">{m.name}</span>
                      {m.graduatedOn && (
                        <span className="text-[10px] font-mono text-cyber-fg-muted">
                          GRADUATED {new Date(m.graduatedOn).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-6 pt-4 border-t border-cyber-outline/10 font-mono text-xs">
            {project.slug && (
              <a
                href={`${LFX_BASE_URL}/project/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-primary hover:text-cyber-primary-hover flex items-center gap-1"
              >
                [LFX PLATFORM] ↗
              </a>
            )}
            {project.repoLink && (
              <a
                href={project.repoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyber-primary hover:text-cyber-primary-hover flex items-center gap-1"
              >
                [GITHUB REPO] ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

