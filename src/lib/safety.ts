import { ALLERGENS } from "../types.ts";
import type {
  AgeBand,
  Allergen,
  AllergenSwap,
  Boost,
  CommunityPost,
  KidProfile,
  Recipe,
} from "../types.ts";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";

/**
 * All allergen, age and diet rules live here so they can be tested in one place.
 *
 * Rules (the safe default is always "hide it"):
 *  1. A boost that contains any selected kid's allergen is never shown or applied.
 *  2. A recipe that contains an allergen is excluded, unless every conflict has a
 *     defined swap whose replacement is itself safe for all selected kids.
 *  3. A community tip with unconfirmed allergen info is hidden from any kid with an allergy.
 *  4. Anything below the youngest selected kid's age band is hidden.
 *  5. With several kids selected, the union of their allergies and the youngest
 *     age band are used, so the result is safe for everyone.
 */

const BAND_ORDER: AgeBand[] = ["1-3", "4-8", "9-12"];
const BAND_MIN_AGE: Record<AgeBand, number> = { "1-3": 1, "4-8": 4, "9-12": 9 };

export type Check = { ok: true } | { ok: false; reason: string };

export function allergenLabel(a: Allergen): string {
  return ALLERGENS.find((x) => x.id === a)?.label.toLowerCase() ?? a;
}

function listLabels(list: Allergen[]): string {
  return list.map(allergenLabel).join(", ");
}

export function youngestBand(kids: KidProfile[]): AgeBand | null {
  if (kids.length === 0) return null;
  return kids.reduce<AgeBand>(
    (min, k) => (BAND_ORDER.indexOf(k.ageBand) < BAND_ORDER.indexOf(min) ? k.ageBand : min),
    kids[0].ageBand,
  );
}

export function combinedAllergies(kids: KidProfile[]): Allergen[] {
  return [...new Set(kids.flatMap((k) => k.allergies))];
}

export function allergensOfIngredients(ids: string[]): Allergen[] {
  const found = new Set<Allergen>();
  for (const id of ids) {
    for (const a of INGREDIENT_BY_ID[id]?.allergens ?? []) found.add(a);
  }
  return [...found];
}

/**
 * Ghee is a pantry staple that can always be replaced with oil, so it is not
 * counted as a dairy conflict. The UI shows a "use oil instead of ghee" note.
 */
const REPLACEABLE_PANTRY = new Set(["ghee"]);

export function usesGhee(recipe: Recipe): boolean {
  return recipe.ingredients.some((i) => i.id === "ghee");
}

function recipeIngredientIds(recipe: Recipe): string[] {
  return recipe.ingredients.map((i) => i.id).filter((id) => !REPLACEABLE_PANTRY.has(id));
}

export function recipeAllergens(recipe: Recipe): Allergen[] {
  return allergensOfIngredients(recipeIngredientIds(recipe));
}

/** Ingredient ids after applying swaps (the replaced ingredient is swapped for its substitute). */
export function applySwaps(recipe: Recipe, swaps: AllergenSwap[]): string[] {
  const ids = recipeIngredientIds(recipe);
  return ids.map((id) => swaps.find((s) => s.replace === id)?.with ?? id);
}

export interface RecipeSafety {
  status: "safe" | "swap" | "blocked";
  conflicts: Allergen[];
  swaps: AllergenSwap[];
  reason?: string;
}

export function checkRecipe(recipe: Recipe, kids: KidProfile[]): RecipeSafety {
  const allergies = combinedAllergies(kids);
  const conflicts = recipeAllergens(recipe).filter((a) => allergies.includes(a));
  if (conflicts.length === 0) return { status: "safe", conflicts, swaps: [] };

  const swaps: AllergenSwap[] = [];
  for (const allergen of conflicts) {
    const swap = recipe.swaps?.find((s) => s.allergen === allergen);
    if (!swap) {
      return {
        status: "blocked",
        conflicts,
        swaps: [],
        reason: `Contains ${allergenLabel(allergen)}`,
      };
    }
    swaps.push(swap);
  }

  // Everything left after the swaps must be safe for every selected kid.
  const remaining = allergensOfIngredients(applySwaps(recipe, swaps)).filter((a) =>
    allergies.includes(a),
  );
  if (remaining.length > 0) {
    return {
      status: "blocked",
      conflicts,
      swaps: [],
      reason: `Even with swaps it contains ${listLabels(remaining)}`,
    };
  }
  return { status: "swap", conflicts, swaps };
}

export function dietAllows(recipe: Recipe, kids: KidProfile[]): boolean {
  return kids.every((kid) => {
    if (kid.diet === "vegetarian") return recipe.diet === "vegetarian";
    if (kid.diet === "jain") {
      return (
        recipe.diet === "vegetarian" &&
        !recipe.ingredients.some((i) => INGREDIENT_BY_ID[i.id]?.jainUnsafe)
      );
    }
    return true;
  });
}

export function checkBoost(boost: Boost, kids: KidProfile[]): Check {
  if (kids.length === 0) return { ok: true };
  const overlap = boost.allergens.filter((a) => combinedAllergies(kids).includes(a));
  if (overlap.length > 0) {
    return { ok: false, reason: `Contains ${listLabels(overlap)}, which is on your allergy list.` };
  }
  const band = youngestBand(kids)!;
  if (BAND_MIN_AGE[band] < boost.minAge) {
    return { ok: false, reason: `Not suggested for kids under ${boost.minAge}.` };
  }
  return { ok: true };
}

export function checkPost(post: CommunityPost, kids: KidProfile[]): Check {
  if (post.status !== "approved") return { ok: false, reason: "Still waiting for review." };
  if (kids.length === 0) return { ok: true };
  const allergies = combinedAllergies(kids);
  if (allergies.length > 0 && !post.allergensConfirmed) {
    return { ok: false, reason: "The allergen info for this tip hasn't been confirmed." };
  }
  const overlap = post.allergenTags.filter((a) => allergies.includes(a));
  if (overlap.length > 0) {
    return { ok: false, reason: `Contains ${listLabels(overlap)}, which is on your allergy list.` };
  }
  const band = youngestBand(kids)!;
  if (BAND_ORDER.indexOf(post.ageBand) > BAND_ORDER.indexOf(band)) {
    return { ok: false, reason: `Shared for kids aged ${post.ageBand}.` };
  }
  return { ok: true };
}
