import { INGREDIENT_BY_ID, INGREDIENTS } from "../data/ingredients.ts";
import type { Allergen, KidProfile } from "../types.ts";
import { combinedAllergies } from "./safety.ts";

/**
 * "More from your fridge": recipe ideas written by an AI model, using only the
 * ingredients the parent picked. The model is never trusted on safety. Every idea is
 * re-checked here against the ingredient table, and kid profiles never leave the device:
 * only ingredient ids that are already safe for the selected kids are sent.
 */

export interface AiIdea {
  name: string;
  blurb: string;
  minutes: number;
  ingredients: { id: string; qty: string }[];
  steps: string[];
}

/** Words that must never appear in an idea's text when the matching allergy is selected. */
const ALLERGEN_WORDS: Record<Allergen, string[]> = {
  dairy: ["milk", "paneer", "cheese", "curd", "yogurt", "yoghurt", "ghee", "butter", "cream", "dahi", "khoya", "malai"],
  egg: ["egg", "mayonnaise", "mayo"],
  soy: ["soy", "soya", "tofu", "tempeh", "edamame", "nutrela"],
  sesame: ["sesame", "til ", "tahini"],
  peanuts: ["peanut", "groundnut"],
  tree_nuts: ["almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut", "pine nut", "coconut", "nut"],
  gluten: ["wheat", "atta", "maida", "flour", "sooji", "semolina", "bread", "pasta", "barley", "roti", "tortilla", "couscous"],
  fish: ["fish", "salmon", "tuna", "anchov"],
  shellfish: ["shrimp", "prawn", "crab", "lobster"],
};

export const PANTRY_IDS = INGREDIENTS.filter((i) => i.category === "pantry").map((i) => i.id);

/** Ingredient ids that may be sent to the model: in the fridge, safe for every kid, plus safe pantry staples. */
export function allowedIngredientIds(fridge: string[], kids: KidProfile[]): string[] {
  const allergies = combinedAllergies(kids);
  const safe = (id: string) => {
    const ing = INGREDIENT_BY_ID[id];
    return !!ing && !ing.allergens.some((a) => allergies.includes(a));
  };
  return [...new Set([...fridge, ...PANTRY_IDS])].filter(safe);
}

function textHasAllergen(text: string, allergies: Allergen[]): boolean {
  const t = ` ${text.toLowerCase()} `;
  return allergies.some((a) => ALLERGEN_WORDS[a].some((w) => t.includes(w)));
}

/** Keeps only well-formed ideas that use allowed ingredients and mention no allergen. Pure, so it is unit-tested. */
export function validateIdeas(raw: unknown, allowed: string[], kids: KidProfile[]): AiIdea[] {
  if (!Array.isArray(raw)) return [];
  const allergies = combinedAllergies(kids);
  const ok = new Set(allowed);
  const out: AiIdea[] = [];

  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const ingredients = Array.isArray(o.ingredients) ? o.ingredients : [];
    const steps = Array.isArray(o.steps) ? o.steps : [];
    if (typeof o.name !== "string" || typeof o.blurb !== "string") continue;
    if (ingredients.length === 0 || steps.length === 0) continue;

    const parsedIngredients: AiIdea["ingredients"] = [];
    let valid = true;
    for (const i of ingredients) {
      const row = i as { id?: unknown; qty?: unknown };
      if (typeof row?.id !== "string" || typeof row?.qty !== "string" || !ok.has(row.id)) {
        valid = false;
        break;
      }
      parsedIngredients.push({ id: row.id, qty: row.qty });
    }
    if (!valid || !steps.every((s) => typeof s === "string")) continue;

    const text = [o.name, o.blurb, ...steps, ...parsedIngredients.map((i) => i.qty)].join(" ");
    if (textHasAllergen(text, allergies)) continue;

    const minutes = typeof o.minutes === "number" && o.minutes > 0 && o.minutes < 240 ? Math.round(o.minutes) : 30;
    out.push({
      name: o.name.slice(0, 80),
      blurb: o.blurb.slice(0, 200),
      minutes,
      ingredients: parsedIngredients,
      steps: (steps as string[]).map((s) => s.slice(0, 400)),
    });
  }
  return out.slice(0, 3);
}
