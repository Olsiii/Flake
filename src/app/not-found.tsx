import Link from "next/link";
import { getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();

  return (
    <div className="bg-brand-500 flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-brand-200 text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="text-display mt-2 text-neutral-50">{t.notFound.title}</h1>
      <p className="text-brand-100 mx-auto mt-4 max-w-md">
        {t.notFound.description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="btn bg-white text-brand-700 hover:bg-neutral-100">
          {t.notFound.backHome}
        </Link>
        <Link
          href="/search"
          className="text-accent-300 hover:text-accent-200 font-medium hover:underline"
        >
          {t.notFound.browseListings}
        </Link>
      </div>
    </div>
  );
}
