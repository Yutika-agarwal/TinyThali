import type { KidProfile, Recipe } from "../types.ts";
import { RECIPES } from "../data/recipes.ts";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { checkRecipe, dietAllows } from "./safety.ts";
import type { RecipeSafety } from "./safety.ts";

export interface MatchResult {
  recipe: Recipe;
  safety: RecipeSafety;
  have: string[];
  missing: string[];
  ratio: number;
  kind: "ready" | "almost";
}

/** Max number of missing ingredients for a recipe to count as "almost there". */
export const ALMOST_MAX_MISSING = 2;

/**
 * Ingredients a recipe needs from the fridge: required, non-pantry, and with any
 * allergen swaps applied (so a tofu swap needs tofu instead of paneer).
 */
export function requiredIngredientIds(recipe: Recipe, safety: RecipeSafety): string[] {
  return recipe.ingredients
    .filter((i) => !i.optional && INGREDIENT_BY_ID[i.id]?.category !== "pantry")
    .map((i) => safety.swaps.find((s) => s.replace === i.id)?.with ?? i.id);
}

export function matchRecipes(fridge: string[], kids: KidProfile[]): MatchResult[] {
  const results: MatchResult[] = [];

  for (const recipe of RECIPES) {
    if (!dietAllows(recipe, kids)) continue;
    const safety = checkRecipe(recipe, kids);
    if (safety.status === "blocked") continue;

    const required = requiredIngredientIds(recipe, safety);
    const have = required.filter((id) => fridge.includes(id));
    const missing = required.filter((id) => !fridge.includes(id));
    if (have.length === 0 || missing.length > ALMOST_MAX_MISSING) continue;

    results.push({
      recipe,
      safety,
      have,
      missing,
      ratio: have.length / required.length,
      kind: missing.length === 0 ? "ready" : "almost",
    });
  }

  return results.sort(
    (a, b) =>
      Number(b.kind === "ready") - Number(a.kind === "ready") ||
      b.ratio - a.ratio ||
      b.have.length - a.have.length ||
      a.recipe.name.localeCompare(b.recipe.name),
  );
}

export const PAGE_SIZE = 5;
const ALMOST_FIRST_PAGE = 3;

/**
 * Never more than PAGE_SIZE recipes at once. The first page leads with what is ready to cook and
 * mixes in at most 3 "almost" ideas; each "See more" adds PAGE_SIZE more (ready first, then almost).
 */
export function pageResults(results: MatchResult[], pages: number) {
  const ready = results.filter((r) => r.kind === "ready");
  const almost = results.filter((r) => r.kind === "almost");
  const firstReady = ready.slice(0, PAGE_SIZE);
  const firstAlmost = almost.slice(0, Math.min(ALMOST_FIRST_PAGE, PAGE_SIZE - firstReady.length));
  const rest = [...ready.slice(firstReady.length), ...almost.slice(firstAlmost.length)];
  const more = rest.slice(0, Math.max(0, pages - 1) * PAGE_SIZE);
  const shown = new Set([...firstReady, ...firstAlmost, ...more]);
  return {
    ready: ready.filter((r) => shown.has(r)),
    almost: almost.filter((r) => shown.has(r)),
    hasMore: shown.size < results.length,
  };
}
