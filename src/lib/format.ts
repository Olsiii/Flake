// Kosovo/Albanian convention writes large numbers with "." as the thousands
// separator and "," for decimals (e.g. 150.000, not 150,000) — the opposite
// of en-US/en-GB. Albanian ICU locale data (sq, sq-AL, sq-XK) actually uses
// a plain space as the grouping separator, not a period, so de-DE is used
// here purely for its separator characters, not as a claim about German
// formatting conventions applying to this site.
const NUMBER_LOCALE = "de-DE";

export const priceFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat(NUMBER_LOCALE);

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
