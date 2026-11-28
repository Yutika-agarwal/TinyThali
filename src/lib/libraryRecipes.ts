import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { RECIPES, RECIPE_BY_ID } from "../data/recipes.ts";
import { ALLERGENS } from "../types.ts";
import type { NutrientBadge, Recipe, Slot } from "../types.ts";
import { isMeatDish } from "./dish.ts";

const SLOTS: Slot[] = ["dough", "filling", "simmer", "batter", "topping", "sweet", "grain", "sauce", "blend", "side", "dollop", "soak"];
const BADGES: NutrientBadge[] = ["Calcium", "Iron", "Protein", "Fiber", "Omega-3"];
const CLAIMS = /\b(cures?|treat(s|ed|ment)?|prevent(s|ed|ion)?|heal(s|ed)?|detox(es)?|reverses?|boosts? immunity)\b/i;
const ALLERGEN_IDS: string[] = ALLERGENS.map((a) => a.id);
const str = (v: unknown, min: number, max: number): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max;

/**
 * Strict check for a recipe that came from outside the app (the review queue).
 * Returns the recipe only if every field is well formed, every ingredient is one we know
 * (so allergens are always computed from our own table, never taken from the draft),
 * and nothing is meat, fish or a health claim. Anything else is dropped, never "fixed".
 */
export function validateRecipe(raw: unknown): Recipe | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!str(r.id, 3, 60) || !/^[a-z0-9-]+$/.test(r.id)) return null;
  if (!str(r.name, 2, 80) || !str(r.emoji, 1, 8) || !str(r.blurb, 5, 160)) return null;
  if (typeof r.minutes !== "number" || r.minutes < 5 || r.minutes > 120) return null;
  if (r.diet !== "vegetarian" && r.diet !== "eggetarian") return null;
  if (!Array.isArray(r.ingredients) || r.ingredients.length < 2 || r.ingredients.length > 25) return null;
  if (!Array.isArray(r.steps) || r.steps.length < 2 || r.steps.length > 12 || !r.steps.every((s) => str(s, 5, 300))) return null;

  const ingredients: Recipe["ingredients"] = [];
  for (const i of r.ingredients as Record<string, unknown>[]) {
    if (!i || typeof i.id !== "string" || !INGREDIENT_BY_ID[i.id] || !str(i.qty, 1, 60)) return null;
    ingredients.push({ id: i.id, qty: i.qty, ...(i.optional === true ? { optional: true } : {}) });
  }
  const hasEgg = ingredients.some((i) => INGREDIENT_BY_ID[i.id].allergens.includes("egg"));
  if (hasEgg && r.diet === "vegetarian") return null;

  const slots: Recipe["slots"] = {};
  if (!r.slots || typeof r.slots !== "object") return null;
  for (const [k, v] of Object.entries(r.slots as Record<string, unknown>)) {
    if (!SLOTS.includes(k as Slot) || !Number.isInteger(v) || (v as number) < 0 || (v as number) >= r.steps.length) return null;
    slots[k as Slot] = v as number;
  }

  const badges = Array.isArray(r.badges) ? r.badges : [];
  if (!badges.every((b) => BADGES.includes(b as NutrientBadge))) return null;

  const swaps: NonNullable<Recipe["swaps"]> = [];
  for (const s of (Array.isArray(r.swaps) ? r.swaps : []) as Record<string, unknown>[]) {
    if (!s || !ALLERGEN_IDS.includes(s.allergen as string)) return null;
    if (typeof s.replace !== "string" || !ingredients.some((i) => i.id === s.replace)) return null;
    if (typeof s.with !== "string" || !INGREDIENT_BY_ID[s.with] || !str(s.note, 5, 240)) return null;
    // A swap must actually remove the allergen it claims to fix.
    if (INGREDIENT_BY_ID[s.with].allergens.includes(s.allergen as never)) return null;
    swaps.push({ allergen: s.allergen as never, replace: s.replace, with: s.with, note: s.note });
  }

  const text = [r.name, r.blurb, ...r.steps].join(" ");
  if (CLAIMS.test(text)) return null;
  if (isMeatDish(text) || ingredients.some((i) => isMeatDish(INGREDIENT_BY_ID[i.id].name))) return null;

  return {
    id: r.id, name: r.name.trim(), emoji: r.emoji, blurb: r.blurb.trim(), minutes: r.minutes, diet: r.diet,
    ingredients, steps: r.steps as string[], slots, badges: badges as NutrientBadge[], ...(swaps.length ? { swaps } : {}),
  };
}

/** Adds approved, valid recipes to the menu. Built-in recipes always win on a clashing id. Returns how many were added. */
export function registerRecipes(rows: unknown[]): number {
  let added = 0;
  for (const raw of rows) {
    const recipe = validateRecipe(raw);
    if (!recipe || RECIPE_BY_ID[recipe.id]) continue;
    RECIPES.push(recipe);
    RECIPE_BY_ID[recipe.id] = recipe;
    added++;
  }
  return added;
}
