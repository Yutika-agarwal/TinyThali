import { BOOSTS } from "../data/boosts.ts";
import { DISH_TYPES } from "../data/dishes.ts";
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
    if (!b.exclusiveGroup) return true;
    if (groups.has(b.exclusiveGroup)) return false;
    groups.add(b.exclusiveGroup);
    return true;
  });
  return { allowed, hiddenCount: fitting.length - safe.length };
}
