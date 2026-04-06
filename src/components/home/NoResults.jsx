export default function NoResults() {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl">🔍</div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        No organizations found
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Try adjusting your search or filters to find what you&apos;re looking for.
      </p>
    </div>
  );
}
