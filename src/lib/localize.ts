import type { Locale } from "@/i18n/config";

/** Picks the Albanian translation of DB-sourced copy when viewing in `sq`
 * and one exists, falling back to the original (English) column otherwise
 * — covers listings/neighborhoods created before translation was added, or
 * where the translation call failed. */
export function localize(
  original: string,
  translated: string | null | undefined,
  locale: Locale,
): string {
  return locale === "sq" && translated ? translated : original;
}

export function localizeList(
  original: string[],
  translated: string[] | null | undefined,
  locale: Locale,
): string[] {
  return locale === "sq" && translated && translated.length === original.length
    ? translated
    : original;
}
