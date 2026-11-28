import { test } from "node:test";
import assert from "node:assert/strict";
import { RECIPE_BY_ID, RECIPES } from "../data/recipes.ts";
import { checkRecipe } from "./safety.ts";
import { registerRecipes, validateRecipe } from "./libraryRecipes.ts";
import type { KidProfile } from "../types.ts";

const good = {
  id: "test-potato-mash-bowl", name: "Potato mash bowl", emoji: "🥔", blurb: "Soft mash with cumin for little eaters.", minutes: 20, diet: "vegetarian",
  ingredients: [{ id: "potato", qty: "2 medium, boiled" }, { id: "paneer", qty: "50 g, crumbled" }, { id: "salt", qty: "to taste" }],
  steps: ["Mash the boiled potatoes with salt.", "Fold in the crumbled paneer and serve warm."],
  slots: { filling: 0, side: 1 }, badges: ["Calcium"],
  swaps: [{ allergen: "dairy", replace: "paneer", with: "tofu", note: "Use crumbled extra-firm tofu instead." }],
};
const kid = (allergies: KidProfile["allergies"]): KidProfile => ({ id: "k", name: "K", age: "4-8", allergies, diet: "vegetarian" } as unknown as KidProfile);
const bad = (patch: Record<string, unknown>) => validateRecipe({ ...good, ...patch });

test("a well-formed library recipe is accepted", () => {
  assert.ok(validateRecipe(good));
});

test("drafts with unknown ingredients, meat, health claims or bad slots are rejected, never repaired", () => {
  assert.equal(bad({ ingredients: [{ id: "unobtainium", qty: "1" }, { id: "salt", qty: "1" }] }), null);
  assert.equal(bad({ name: "Chicken mash" }), null);
  assert.equal(bad({ blurb: "This mash cures colds in kids." }), null);
  assert.equal(bad({ slots: { filling: 9 } }), null);
  assert.equal(bad({ slots: { bogus: 0 } }), null);
  assert.equal(bad({ minutes: 500 }), null);
  assert.equal(bad({ id: "Bad Id!" }), null);
  assert.equal(validateRecipe("nope"), null);
});

test("a swap that keeps the allergen is rejected", () => {
  assert.equal(bad({ swaps: [{ allergen: "dairy", replace: "paneer", with: "paneer", note: "Use the same thing." }] }), null);
});

test("allergens come from our ingredient table, so a library recipe is blocked or swapped for a dairy-allergic kid", () => {
  const before = RECIPES.length;
  assert.equal(registerRecipes([good]), 1);
  assert.equal(RECIPES.length, before + 1);
  const r = RECIPE_BY_ID["test-potato-mash-bowl"];
  assert.equal(checkRecipe(r, [kid(["dairy"])]).status, "swap");
  const noSwap = { ...good, id: "test-no-swap", swaps: [] };
  registerRecipes([noSwap]);
  assert.equal(checkRecipe(RECIPE_BY_ID["test-no-swap"], [kid(["dairy"])]).status, "blocked");
});

test("a library recipe can never replace a built-in one", () => {
  const first = RECIPES[0];
  assert.equal(registerRecipes([{ ...good, id: first.id }]), 0);
  assert.equal(RECIPE_BY_ID[first.id], first);
});
