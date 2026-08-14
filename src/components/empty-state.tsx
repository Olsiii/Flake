import Link from "next/link";
import type { ReactNode } from "react";

function DefaultIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
      <path
        d="M4 7.5 12 3l8 4.5M4 7.5v9L12 21m-8-4.5L12 21m0 0 8-4.5v-9M12 21v-9m0 0L4 7.5M12 12l8-4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; href: string };
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-200 px-6 py-14 text-center dark:border-neutral-800">
      <div className="text-neutral-300 dark:text-neutral-700">
        {icon ?? <DefaultIcon />}
      </div>
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-neutral-500">{description}</p>
      )}
      {action && (
        <Link href={action.href} className="btn btn-sm btn-primary mt-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}
