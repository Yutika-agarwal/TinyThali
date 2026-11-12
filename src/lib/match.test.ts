import { test } from "node:test";
import assert from "node:assert/strict";
import type { KidProfile } from "../types.ts";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { matchRecipes } from "./match.ts";
import { checkRecipe } from "./safety.ts";
import {
  badgeSummary,
  boostStepIndex,
  boostsForRecipe,
  displayIngredients,
  toggleBoost,
  visibleBoosts,
} from "./boosts.ts";
import { BOOST_BY_ID } from "../data/boosts.ts";

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  id: "k",
  nickname: "K",
  ageBand: "4-8",
  allergies: [],
  diet: "vegetarian",
  picky: false,
  ...over,
});

test("beetroot + paneer + atta gives the beet paneer paratha first", () => {
  const results = matchRecipes(["beetroot", "paneer", "atta"], [kid()]);
  assert.equal(results[0].recipe.id, "beet-paneer-paratha");
  assert.equal(results[0].kind, "ready");
  assert.deepEqual(results[0].missing, []);
});

test("recipes missing one or two items show up as 'almost'", () => {
  const results = matchRecipes(["atta", "beetroot"], [kid()]);
  const paratha = results.find((r) => r.recipe.id === "beet-paneer-paratha");
  assert.equal(paratha?.kind, "almost");
  assert.deepEqual(paratha?.missing, ["paneer"]);
});

test("recipes missing three or more items are not suggested", () => {
  const results = matchRecipes(["spinach"], [kid()]);
  assert.ok(!results.some((r) => r.recipe.id === "palak-paneer" && r.missing.length > 2));
});

test("empty fridge returns nothing", () => {
  assert.deepEqual(matchRecipes([], [kid()]), []);
});

test("blocked recipes never appear", () => {
  const results = matchRecipes(["atta", "potato"], [kid({ allergies: ["gluten"] })]);
  assert.ok(!results.some((r) => r.recipe.id === "aloo-paratha"));
});

test("dairy swap needs tofu in the fridge instead of paneer", () => {
  const dairyKid = [kid({ allergies: ["dairy"] })];
  const withTofu = matchRecipes(["atta", "beetroot", "tofu"], dairyKid);
  const ready = withTofu.find((r) => r.recipe.id === "beet-paneer-paratha");
  assert.equal(ready?.kind, "ready");
  assert.equal(ready?.safety.status, "swap");

  const withPaneer = matchRecipes(["atta", "beetroot", "paneer"], dairyKid);
  const almost = withPaneer.find((r) => r.recipe.id === "beet-paneer-paratha");
  assert.equal(almost?.kind, "almost");
  assert.deepEqual(almost?.missing, ["tofu"]);
});

test("vegetarian kids don't get egg recipes", () => {
  const results = matchRecipes(["eggs", "onion", "tomato"], [kid({ diet: "vegetarian" })]);
  assert.ok(!results.some((r) => r.recipe.id === "egg-bhurji"));
  const eggetarian = matchRecipes(["eggs", "onion", "tomato"], [kid({ diet: "eggetarian" })]);
  assert.ok(eggetarian.some((r) => r.recipe.id === "egg-bhurji"));
});

test("boosts attach to the right recipe steps", () => {
  const paratha = RECIPE_BY_ID["beet-paneer-paratha"];
  assert.equal(boostStepIndex(paratha, BOOST_BY_ID.ragi), 0);
  assert.equal(boostStepIndex(paratha, BOOST_BY_ID.sesame), 1);
  assert.equal(boostStepIndex(paratha, BOOST_BY_ID.hemp), null);
  const ids = boostsForRecipe(RECIPE_BY_ID["egg-bhurji"]).map((b) => b.id);
  assert.ok(ids.includes("hemp") && ids.includes("flax"));
});

test("only one flour swap can be selected at a time", () => {
  let selected = toggleBoost([], "ragi");
  selected = toggleBoost(selected, "sesame");
  selected = toggleBoost(selected, "jowar");
  assert.deepEqual(selected.sort(), ["jowar", "sesame"]);
  assert.deepEqual(toggleBoost(selected, "jowar").sort(), ["sesame"]);
});

test("visibleBoosts hides unsafe boosts and explains why", () => {
  const { allowed, hidden } = visibleBoosts(RECIPE_BY_ID["beet-paneer-paratha"], [
    kid({ ageBand: "1-3", allergies: ["sesame", "soy"] }),
  ]);
  const allowedIds = allowed.map((b) => b.id);
  assert.ok(!allowedIds.includes("sesame") && !allowedIds.includes("tofu-dough"));
  assert.ok(allowedIds.includes("ragi"));
  assert.ok(hidden.every((h) => h.reason.length > 0));
});

test("badge summary shows what a boost adds", () => {
  const summary = badgeSummary(RECIPE_BY_ID["aloo-paratha"], ["ragi", "flax"]);
  assert.deepEqual(summary.before, []);
  assert.deepEqual(summary.added.sort(), ["Calcium", "Fiber", "Iron", "Omega-3"]);
});

test("display ingredients show the swap", () => {
  const recipe = RECIPE_BY_ID["palak-paneer"];
  const lines = displayIngredients(recipe, recipe.swaps ?? []);
  assert.ok(lines.some((l) => l.id === "tofu" && l.swapNote));
  assert.ok(!lines.some((l) => l.id === "paneer"));
});

test("pesto swaps for dairy and tree nut allergies", () => {
  const r = RECIPE_BY_ID["spinach-pesto-pasta"];
  const res = checkRecipe(r, [kid({ allergies: ["dairy", "tree_nuts"] })]);
  assert.equal(res.status, "swap");
  assert.equal(res.swaps.length, 2);
});

test("whey boost hidden for dairy allergy, shown otherwise", () => {
  const r = RECIPE_BY_ID["aloo-paratha"];
  assert.ok(!visibleBoosts(r, [kid({ allergies: ["dairy"] })]).allowed.some((b) => b.id === "whey-dough"));
  assert.ok(visibleBoosts(r, [kid()]).allowed.some((b) => b.id === "whey-dough"));
});

test("new date sugar and ajwain boosts respect age", () => {
  const r = RECIPE_BY_ID["sooji-halwa"];
  assert.ok(!visibleBoosts(r, [kid({ ageBand: "1-3" })]).allowed.some((b) => b.id === "date-sugar"));
});

test("quinoa swap attaches to khichdi rice step", () => {
  const r = RECIPE_BY_ID["veg-khichdi"];
  assert.equal(boostStepIndex(r, BOOST_BY_ID["quinoa-swap"]), 0);
});

import { allowedIngredientIds, validateIdeas } from "./aiIdeas.ts";

test("AI ideas: unknown ingredients and allergen words are rejected", () => {
  const kids = [kid({ allergies: ["dairy"] })];
  const allowed = allowedIngredientIds(["potato", "paneer", "spinach"], kids);
  assert.ok(!allowed.includes("paneer"));
  assert.ok(!allowed.includes("ghee"));
  const good = { name: "Aloo palak", blurb: "Simple.", minutes: 20, ingredients: [{ id: "potato", qty: "2" }], steps: ["Boil.", "Mash with spinach."] };
  const sneaky = { ...good, name: "Creamy aloo", steps: ["Add a splash of cream."] };
  const unknown = { ...good, ingredients: [{ id: "paneer", qty: "100 g" }] };
  const out = validateIdeas([good, sneaky, unknown, "junk", null], allowed, kids);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "Aloo palak");
});
