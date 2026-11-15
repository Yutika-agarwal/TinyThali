/** Pure helpers for the pay-what-you-want screen (unit-tested). Amounts are US dollars. */
export const PRESETS = [0, 3, 5, 10] as const;
export const MIN_DOLLARS = 1;
export const MAX_DOLLARS = 500;

/** Parses what the parent typed into whole cents, or null if it isn't a payable amount. */
export function dollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  return cents >= MIN_DOLLARS * 100 && cents <= MAX_DOLLARS * 100 ? cents : null;
}
