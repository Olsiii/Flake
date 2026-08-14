import Link from "next/link";

export function LegalPage({
  title,
  html,
  filename,
}: {
  title: string;
  html: string | null;
  filename: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Link
        href="/"
        className="text-accent-700 hover:text-accent-900 text-sm font-medium hover:underline"
      >
        ← Back to home
      </Link>
      <h1 className="text-h1 mt-4">{title}</h1>
      {html ? (
        <div
          className="prose prose-neutral dark:prose-invert mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          This page hasn&apos;t been added yet — drop{" "}
          <code className="text-2xs rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">
            {filename}
          </code>{" "}
          into the <code className="text-2xs rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">/legal</code>{" "}
          folder at the project root.
        </p>
      )}
    </div>
  );
}
