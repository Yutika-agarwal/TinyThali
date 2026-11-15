import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import type { Boost, KidProfile, Recipe } from "../types.ts";

const HARD_BITS = /\b(nuts?|seeds?|makhana|almonds?|cashews?|walnuts?|peanuts?|sesame|flax|hemp|chia)\b/i;

/** A toddler-safety line when the dish (or a chosen boost) has nuts, seeds or makhana. Null otherwise. */
export function textureNote(recipe: Recipe, boosts: Boost[], kids: KidProfile[]): string | null {
  if (!kids.some((k) => k.ageBands.includes("1-3"))) return null;
  const inRecipe = recipe.ingredients.some((i) => HARD_BITS.test(INGREDIENT_BY_ID[i.id]?.name ?? ""));
  const inBoost = boosts.some((b) => HARD_BITS.test(`${b.name} ${b.add}`));
  if (!inRecipe && !inBoost) return null;
  return "For toddlers: grind or crush nuts, seeds and makhana to a powder or paste. Never serve them whole.";
}
