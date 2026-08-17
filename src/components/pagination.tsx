import Link from "next/link";
import { getDictionary } from "@/i18n/server";

export async function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;
  const t = await getDictionary();

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
          ← {t.listing.previous}
        </Link>
      ) : (
        <span className="btn-sm text-neutral-300 dark:text-neutral-700">
          ← {t.listing.previous}
        </span>
      )}
      <span className="text-neutral-500">
        {t.common.page} {page} {t.common.of} {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={`${basePath}?page=${page + 1}`}
          className="btn-sm btn-secondary"
        >
          {t.listing.next} →
        </Link>
      ) : (
        <span className="btn-sm text-neutral-300 dark:text-neutral-700">
          {t.listing.next} →
        </span>
      )}
    </nav>
  );
}
