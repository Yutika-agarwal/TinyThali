import { BOOSTS } from "../data/boosts.ts";
import { DISH_TYPES } from "../data/dishes.ts";
import { RECIPES } from "../data/recipes.ts";
import type { DishType } from "../data/dishes.ts";
import type { Boost, KidProfile } from "../types.ts";
import { checkBoost } from "./safety.ts";

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Best dish type for what the parent typed, or null (we'd rather say "not sure" than guess wrong).
 * Keywords must match whole words, and the one nearest the end wins, because the end of a dish name
 * is the dish ("masala dosa" is a dosa, "paneer paratha" is a paratha). Ties go to the longer phrase.
 */
export function detectDish(query: string): DishType | null {
  const q = norm(query);
  if (q.length < 2 || isMeatDish(q)) return null;
  let best: { type: DishType; end: number; len: number } | null = null;
  for (const type of DISH_TYPES) {
    for (const raw of type.keywords) {
      const k = norm(raw);
      const re = new RegExp(`(?:^| )${escapeRe(k)}(?:s|es)?(?= |$)`, "g");
      for (const m of q.matchAll(re)) {
        const end = m.index! + m[0].length;
        if (!best || end > best.end || (end === best.end && k.length > best.len)) best = { type, end, len: k.length };
      }
    }
  }
  return best?.type ?? null;
}

const MEAT = ["chicken", "mutton", "lamb", "fish", "prawn", "shrimp", "meat", "keema", "beef", "pork", "bacon", "ham", "salami", "sausage", "turkey", "crab"];
/** True when the dish has meat or fish. We only suggest for vegetarian dishes and eggs. */
export function isMeatDish(query: string): boolean {
  const words = norm(query).split(" ");
  return MEAT.some((m) => words.includes(m));
}

export interface DishBoosts {
  /** Safe for every selected kid, best first. Only one boost per exclusive group. */
  allowed: Boost[];
  /** How many fitting boosts were hidden for allergy or age reasons. */
  hiddenCount: number;
}

/** Some boosts only make sense for certain dishes (peanut butter in pancake batter, not in dosa). */
export function boostFitsDish(b: Boost, dishId: string | null): boolean {
  return !b.onlyDishes || (dishId !== null && b.onlyDishes.includes(dishId));
}

/** Boosts that fit a dish type and are safe for these kids. Easiest first. */
export function boostsForDish(type: DishType, kids: KidProfile[]): DishBoosts {
  const picky = kids.some((k) => k.picky);
  const fitting = BOOSTS.filter((b) => b.slots.some((s) => type.slots.includes(s)) && boostFitsDish(b, type.id));
  const safe = fitting.filter((b) => checkBoost(b, kids).ok);
  // Lead with the steps the dish lists first (a quesadilla leads with its dip), then picky-friendly, then richer.
  const order = (b: Boost) => Math.min(...b.slots.map((s) => (type.slots.includes(s) ? type.slots.indexOf(s) : 99)));
  const ranked = [...safe].sort((a, b) => {
    if (order(a) !== order(b)) return order(a) - order(b);
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
  if (q.length < 2 || isMeatDish(q)) return [];
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
