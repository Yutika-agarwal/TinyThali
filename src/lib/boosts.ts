import type {
  AllergenSwap,
  Boost,
  CommunityPost,
  KidProfile,
  NutrientBadge,
  Recipe,
} from "../types.ts";
import { BOOSTS } from "../data/boosts.ts";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { checkBoost } from "./safety.ts";

/** Index of the recipe step a boost attaches to, or null if the recipe has no matching slot. */
export function boostStepIndex(recipe: Recipe, boost: Boost): number | null {
  for (const slot of boost.slots) {
    const idx = recipe.slots[slot];
    if (idx !== undefined) return idx;
  }
  return null;
}

export function boostsForRecipe(recipe: Recipe): Boost[] {
  return BOOSTS.filter((b) => boostStepIndex(recipe, b) !== null);
}

export interface BoostOptions {
  allowed: Boost[];
  hidden: { boost: Boost; reason: string }[];
}

/** Split a recipe's boosts into the ones that are safe for these kids and the ones that are hidden. */
export function visibleBoosts(recipe: Recipe, kids: KidProfile[]): BoostOptions {
  const allowed: Boost[] = [];
  const hidden: BoostOptions["hidden"] = [];
  for (const boost of boostsForRecipe(recipe)) {
    const check = checkBoost(boost, kids);
    if (check.ok) allowed.push(boost);
    else hidden.push({ boost, reason: check.reason });
  }
  return { allowed, hidden };
}

/** Toggle a boost on or off. Boosts in the same exclusive group replace each other. */
export function toggleBoost(selected: string[], id: string): string[] {
  if (selected.includes(id)) return selected.filter((x) => x !== id);
  const boost = BOOSTS.find((b) => b.id === id);
  if (!boost) return selected;
  const next = boost.exclusiveGroup
    ? selected.filter((s) => BOOSTS.find((b) => b.id === s)?.exclusiveGroup !== boost.exclusiveGroup)
    : selected;
  return [...next, id];
}

/**
 * One-tap "Boost it for me": a small, sensible default. At most one boost per recipe step and
 * two in total, never two from the same exclusive group, preferring boosts that blend in for
 * picky eaters and boosts that earn more nutrient badges. Only allowed boosts are considered.
 */
export function autoBoosts(recipe: Recipe, kids: KidProfile[], max = 2): string[] {
  const picky = kids.some((k) => k.picky);
  const ranked = [...visibleBoosts(recipe, kids).allowed].sort((a, b) => {
    if (picky && !!a.blendsIn !== !!b.blendsIn) return a.blendsIn ? -1 : 1;
    return b.badges.length - a.badges.length;
  });
  const chosen: string[] = [];
  const steps = new Set<number | null>();
  for (const boost of ranked) {
    if (chosen.length >= max) break;
    const step = boostStepIndex(recipe, boost);
    if (steps.has(step)) continue;
    const next = toggleBoost(chosen, boost.id);
    if (next.length <= chosen.length) continue; // an exclusive group would have replaced one
    chosen.splice(0, chosen.length, ...next);
    steps.add(step);
  }
  return chosen;
}

/** Drop any selected ids that are not currently allowed (e.g. after switching kid profiles). */
export function pruneSelected(selected: string[], allowed: Boost[]): string[] {
  const ok = new Set(allowed.map((b) => b.id));
  return selected.filter((id) => ok.has(id));
}

export function boostTextsForStep(recipe: Recipe, step: number, boostIds: string[]): Boost[] {
  return BOOSTS.filter((b) => boostIds.includes(b.id) && boostStepIndex(recipe, b) === step);
}

export function postsForStep(recipe: Recipe, step: number, posts: CommunityPost[]): CommunityPost[] {
  // Community tips are free text, so show them on the last step of the recipe.
  return step === recipe.steps.length - 1 ? posts : [];
}

export interface BadgeSummary {
  before: NutrientBadge[];
  after: NutrientBadge[];
  added: NutrientBadge[];
}

export function badgeSummary(recipe: Recipe, boostIds: string[]): BadgeSummary {
  const before = [...recipe.badges];
  const gained = BOOSTS.filter((b) => boostIds.includes(b.id)).flatMap((b) => b.badges);
  const after = [...new Set([...before, ...gained])];
  const added = after.filter((b) => !before.includes(b));
  return { before, after, added };
}

export interface DisplayIngredient {
  id: string;
  name: string;
  emoji: string;
  qty: string;
  optional: boolean;
  swapNote?: string;
}

/** Ingredient lines for display, with allergen swaps applied. */
export function displayIngredients(recipe: Recipe, swaps: AllergenSwap[]): DisplayIngredient[] {
  return recipe.ingredients.map((ing) => {
    const swap = swaps.find((s) => s.replace === ing.id);
    const target = INGREDIENT_BY_ID[swap?.with ?? ing.id];
    return {
      id: target.id,
      name: target.name,
      emoji: target.emoji,
      qty: ing.qty,
      optional: ing.optional ?? false,
      swapNote: swap?.note,
    };
  });
}
