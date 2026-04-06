export default function OrgStats({ org }) {
  const stats = [
    { label: 'Total Projects', value: org.totalProjects },
    { label: 'Mentees Graduated', value: org.totalMentees },
    { label: 'Terms Active', value: org.participations.length },
    { label: 'Years Active', value: org.yearsActive.length },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stat.value.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
