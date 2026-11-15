import { BOOSTS } from "../data/boosts.ts";
import { DISH_TYPES } from "../data/dishes.ts";
import { RECIPES } from "../data/recipes.ts";
import type { DishType } from "../data/dishes.ts";
import type { Boost, KidProfile } from "../types.ts";
import { checkBoost } from "./safety.ts";

/** Best dish type for what the parent typed, or null. Longer keyword matches win. */
export function detectDish(query: string): DishType | null {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ")} `;
  if (q.trim().length < 2) return null;
  let best: { type: DishType; score: number } | null = null;
  for (const type of DISH_TYPES) {
    let score = 0;
    for (const k of type.keywords) if (q.includes(k)) score += k.length;
    if (score > 0 && (!best || score > best.score)) best = { type, score };
  }
  return best?.type ?? null;
}

export interface DishBoosts {
  /** Safe for every selected kid, best first. Only one boost per exclusive group. */
  allowed: Boost[];
  /** How many fitting boosts were hidden for allergy or age reasons. */
  hiddenCount: number;
}

/** Boosts that fit a dish type and are safe for these kids. Easiest first. */
export function boostsForDish(type: DishType, kids: KidProfile[]): DishBoosts {
  const picky = kids.some((k) => k.picky);
  const fitting = BOOSTS.filter((b) => b.slots.some((s) => type.slots.includes(s)));
  const safe = fitting.filter((b) => checkBoost(b, kids).ok);
  const ranked = [...safe].sort((a, b) => {
    if (picky && !!a.blendsIn !== !!b.blendsIn) return a.blendsIn ? -1 : 1;
    return b.badges.length - a.badges.length;
  });
  const groups = new Set<string>();
  const allowed = ranked.filter((b) => {
    if (!b.exclusiveGroup || b.exclusiveGroup === "dough-add") return true; // dough-add are just alternatives to list
    if (groups.has(b.exclusiveGroup)) return false;
    groups.add(b.exclusiveGroup);
    return true;
  });
  return { allowed, hiddenCount: fitting.length - safe.length };
}

const SUGGESTION_POOL: string[] = (() => {
  const names = new Map<string, string>();
  const add = (n: string) => names.set(n.toLowerCase(), n);
  for (const r of RECIPES) add(r.name);
  for (const d of DISH_TYPES) for (const k of d.keywords) add(k.trim().replace(/^./, (c) => c.toUpperCase()));
  return [...names.values()].filter((n) => detectDish(n) !== null);
})();

/** Predictive text for "what are you cooking": names that start with, then contain, what was typed. */
export function suggestDishes(query: string, max = 5): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  if (SUGGESTION_POOL.some((n) => n.toLowerCase() === q)) return []; // they picked one: done
  const rank = (n: string): number => {
    const l = n.toLowerCase();
    if (l === q) return -1;
    if (l.startsWith(q)) return 0;
    if (l.split(/[\s-]+/).some((w) => w.startsWith(q))) return 1;
    return l.includes(q) ? 2 : -1;
  };
  return SUGGESTION_POOL.map((n) => ({ n, r: rank(n) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r || a.n.length - b.n.length || a.n.localeCompare(b.n))
    .slice(0, max)
    .map((x) => x.n);
}

/** Normalised dish text worth keeping for menu research, or null (too short, has digits, looks like contact info). */
export function dishToLog(query: string): string | null {
  const d = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (d.length < 3 || d.length > 60) return null;
  if (/[0-9@/:]/.test(d)) return null;
  return d;
}
