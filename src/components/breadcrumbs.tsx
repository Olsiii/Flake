import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  /** Omitted (or falsy) for the current page — rendered as plain text, not a link. */
  href?: string;
}

/** Server component — every current caller (city/neighborhood/listing
 * pages) already has its labels available server-side, no need for a
 * client boundary. Emits visible text only; JSON-LD (where wanted) is a
 * separate concern the caller adds itself, same pattern as the listing
 * page's existing RealEstateListing schema. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-sm text-neutral-500 dark:text-neutral-400"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-neutral-900 hover:underline dark:hover:text-neutral-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="truncate text-neutral-700 dark:text-neutral-300"
                aria-current="page"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
