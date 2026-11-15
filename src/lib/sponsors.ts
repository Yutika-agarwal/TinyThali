import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { mentionsAllergy } from "./safety.ts";
import type { Allergen, Diet, SponsorOffer } from "../types.ts";

export interface SponsorContext {
  allergies: Allergen[];
  /** The parents' own allergy words. */
  others?: string[];
  diets: Diet[];
  /** YYYY-MM-DD */
  today: string;
}

/** True when promoting this ingredient could conflict with any selected kid. */
export function ingredientConflicts(ingredientId: string, ctx: SponsorContext): boolean {
  const ing = INGREDIENT_BY_ID[ingredientId];
  if (!ing) return true;
  if (ing.allergens.some((a) => ctx.allergies.includes(a))) return true;
  if ((ctx.others ?? []).some((w) => mentionsAllergy(ing.name, w))) return true;
  if (ctx.diets.includes("jain") && ing.jainUnsafe) return true;
  return false;
}

export function isValidOffer(o: SponsorOffer): boolean {
  try {
    return new URL(o.url).protocol === "https:" && o.store.trim() !== "" && o.headline.length <= 60;
  } catch {
    return false;
  }
}

/**
 * Choose at most `max` offers for the ingredients on screen. Safety first: an offer for an
 * ingredient that conflicts with a kid's allergy or diet is never shown. One offer per store
 * and per ingredient, highest priority first.
 */
export function pickOffers(
  offers: SponsorOffer[],
  ingredientIds: string[],
  ctx: SponsorContext,
  max = 1,
): SponsorOffer[] {
  const wanted = new Set(ingredientIds);
  const seenStore = new Set<string>();
  const out: SponsorOffer[] = [];
  const live = offers
    .filter(
      (o) =>
        wanted.has(o.ingredientId) &&
        isValidOffer(o) &&
        o.startsOn <= ctx.today &&
        ctx.today <= o.endsOn &&
        !ingredientConflicts(o.ingredientId, ctx),
    )
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  for (const o of live) {
    if (seenStore.has(o.store)) continue;
    seenStore.add(o.store);
    out.push(o);
    if (out.length >= max) break;
  }
  return out;
}
