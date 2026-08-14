import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-4 text-sm"
    >
      {page > 1 ? (
        <Link
          href={`${basePath}?page=${page - 1}`}
          className="btn-sm btn-secondary"
        >
          ← Previous
        </Link>
      ) : (
        <span className="btn-sm text-neutral-300 dark:text-neutral-700">
          ← Previous
        </span>
      )}
      <span className="text-neutral-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="btn-sm btn-secondary"
        >
          Next →
        </Link>
      ) : (
        <span className="btn-sm text-neutral-300 dark:text-neutral-700">
          Next →
        </span>
      )}
    </nav>
  );
}
