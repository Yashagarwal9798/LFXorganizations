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
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="mt-0.5 text-gray-400">
          {expanded ? '▼' : '▶'}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {project.title}
          </h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
            {mentorNames && `${mentorNames}  ·  `}{skillNames}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-700">
          {project.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {project.description}
            </p>
          )}

          {project.skills.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Expected Skills
              </h5>
              <div className="flex flex-wrap gap-1">
                {project.skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {project.mentors.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Mentors
              </h5>
              <div className="space-y-2">
                {project.mentors.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {graduatedMentees.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Mentees who completed
              </h5>
              <div className="space-y-2">
                {graduatedMentees.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Avatar src={m.avatarUrl} name={m.name} size="sm" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{m.name}</span>
                    {m.graduatedOn && (
                      <span className="text-xs text-gray-400">
                        · Graduated {new Date(m.graduatedOn).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-3">
            {project.slug && (
              <a
                href={`${LFX_BASE_URL}/project/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                View on LFX ↗
              </a>
            )}
            {project.repoLink && (
              <a
                href={project.repoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                GitHub Repo ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
