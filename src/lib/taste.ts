import type { CookEntry, Reaction } from "../types.ts";

/** The most recent reaction logged for each recipe (history is newest first). */
export function lastReactions(history: CookEntry[]): Record<string, Reaction> {
  const out: Record<string, Reaction> = {};
  for (const h of history) if (!(h.recipeId in out)) out[h.recipeId] = h.reaction;
  return out;
}

/** Stable sort key: loved dishes first, refused ones last. */
export function tasteRank(reaction: Reaction | undefined): number {
  return reaction === "loved" ? -1 : reaction === "not_this_time" ? 1 : 0;
}

/** Re-orders items within each group so loved dishes come first and refused ones last. */
export function byTaste<T>(items: T[], idOf: (t: T) => string, last: Record<string, Reaction>): T[] {
  return items
    .map((t, i) => ({ t, i }))
    .sort((a, b) => tasteRank(last[idOf(a.t)]) - tasteRank(last[idOf(b.t)]) || a.i - b.i)
    .map((x) => x.t);
}
