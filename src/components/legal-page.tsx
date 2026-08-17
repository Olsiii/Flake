import Link from "next/link";
import { getDictionary } from "@/i18n/server";

export async function LegalPage({
  title,
  html,
  filename,
}: {
  title: string;
  html: string | null;
  filename: string;
}) {
  const t = await getDictionary();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Link
        href="/"
        className="text-accent-700 hover:text-accent-900 text-sm font-medium hover:underline"
      >
        {t.legal.backToHome}
      </Link>
      <h1 className="text-h1 mt-4">{title}</h1>
      {html ? (
        <>
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            {t.legal.englishOnlyNote}
          </p>
          <div
            className="prose prose-neutral dark:prose-invert mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      ) : (
        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
          {t.legal.notAddedYet}{" "}
          <code className="text-2xs rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">
            {filename}
          </code>{" "}
          {t.legal.intoFolder}{" "}
          <code className="text-2xs rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">/legal</code>{" "}
          {t.legal.folderAtRoot}
        </p>
      )}
    </div>
  );
}
