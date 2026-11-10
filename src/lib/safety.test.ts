import { test } from "node:test";
import assert from "node:assert/strict";
import type { CommunityPost, KidProfile } from "../types.ts";
import { BOOST_BY_ID } from "../data/boosts.ts";
import { RECIPE_BY_ID, RECIPES } from "../data/recipes.ts";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { SAMPLE_POSTS } from "../data/community.ts";
import {
  checkBoost,
  checkPost,
  checkRecipe,
  combinedAllergies,
  dietAllows,
  usesGhee,
  youngestBand,
} from "./safety.ts";

const kid = (over: Partial<KidProfile> = {}): KidProfile => ({
  id: "k",
  nickname: "K",
  ageBand: "4-8",
  allergies: [],
  diet: "vegetarian",
  picky: false,
  ...over,
});

test("several kids: union of allergies and youngest band", () => {
  const kids = [
    kid({ id: "a", ageBand: "9-12", allergies: ["dairy"] }),
    kid({ id: "b", ageBand: "1-3", allergies: ["soy", "dairy"] }),
  ];
  assert.equal(youngestBand(kids), "1-3");
  assert.deepEqual(combinedAllergies(kids).sort(), ["dairy", "soy"]);
  assert.equal(youngestBand([]), null);
});

test("sesame allergy hides the sesame boost but not others", () => {
  const kids = [kid({ allergies: ["sesame"] })];
  assert.equal(checkBoost(BOOST_BY_ID.sesame, kids).ok, false);
  assert.equal(checkBoost(BOOST_BY_ID.flax, kids).ok, true);
  assert.equal(checkBoost(BOOST_BY_ID.ragi, kids).ok, true);
});

test("soy allergy hides the tofu dough boost", () => {
  assert.equal(checkBoost(BOOST_BY_ID["tofu-dough"], [kid({ allergies: ["soy"] })]).ok, false);
  assert.equal(checkBoost(BOOST_BY_ID["tofu-dough"], [kid()]).ok, true);
});

test("age band hides boosts that need an older child", () => {
  const toddler = [kid({ ageBand: "1-3" })];
  assert.equal(checkBoost(BOOST_BY_ID.hemp, toddler).ok, false);
  assert.equal(checkBoost(BOOST_BY_ID.pumpkin, toddler).ok, false);
  assert.equal(checkBoost(BOOST_BY_ID.flax, toddler).ok, true);
  assert.equal(checkBoost(BOOST_BY_ID.hemp, [kid({ ageBand: "4-8" })]).ok, true);
});

test("one allergic kid among several hides the boost for everyone", () => {
  const kids = [kid({ id: "a" }), kid({ id: "b", allergies: ["sesame"] })];
  assert.equal(checkBoost(BOOST_BY_ID.sesame, kids).ok, false);
});

test("no profile means no filtering", () => {
  assert.equal(checkBoost(BOOST_BY_ID.sesame, []).ok, true);
});

test("dairy allergy: paneer recipes use a tofu swap", () => {
  const result = checkRecipe(RECIPE_BY_ID["beet-paneer-paratha"], [kid({ allergies: ["dairy"] })]);
  assert.equal(result.status, "swap");
  assert.equal(result.swaps[0].with, "tofu");
});

test("dairy + soy allergy blocks paneer recipes (tofu swap is unsafe)", () => {
  const result = checkRecipe(RECIPE_BY_ID["palak-paneer"], [kid({ allergies: ["dairy", "soy"] })]);
  assert.equal(result.status, "blocked");
});

test("dairy in two kids' profiles: one dairy, one soy blocks paneer recipes", () => {
  const kids = [kid({ id: "a", allergies: ["dairy"] }), kid({ id: "b", allergies: ["soy"] })];
  assert.equal(checkRecipe(RECIPE_BY_ID["paneer-bhurji"], kids).status, "blocked");
});

test("recipe with no swap is blocked (curd in thepla, dairy)", () => {
  const result = checkRecipe(RECIPE_BY_ID["spinach-thepla"], [kid({ allergies: ["dairy"] })]);
  assert.equal(result.status, "blocked");
  assert.match(result.reason ?? "", /dairy/);
});

test("ghee never blocks a recipe, but the recipe reports it uses ghee", () => {
  const dal = RECIPE_BY_ID["moong-dal-tadka"];
  assert.equal(checkRecipe(dal, [kid({ allergies: ["dairy"] })]).status, "safe");
  assert.equal(usesGhee(dal), true);
});

test("gluten allergy blocks atta and sooji recipes, not besan chilla", () => {
  const kids = [kid({ allergies: ["gluten"] })];
  assert.equal(checkRecipe(RECIPE_BY_ID["aloo-paratha"], kids).status, "blocked");
  assert.equal(checkRecipe(RECIPE_BY_ID["veg-upma"], kids).status, "blocked");
  assert.equal(checkRecipe(RECIPE_BY_ID["besan-chilla"], kids).status, "safe");
});

test("egg allergy: egg bhurji becomes a tofu bhurji", () => {
  const result = checkRecipe(RECIPE_BY_ID["egg-bhurji"], [kid({ diet: "eggetarian", allergies: ["egg"] })]);
  assert.equal(result.status, "swap");
});

test("diet rules", () => {
  assert.equal(dietAllows(RECIPE_BY_ID["egg-bhurji"], [kid({ diet: "vegetarian" })]), false);
  assert.equal(dietAllows(RECIPE_BY_ID["egg-bhurji"], [kid({ diet: "eggetarian" })]), true);
  assert.equal(dietAllows(RECIPE_BY_ID["aloo-paratha"], [kid({ diet: "jain" })]), false);
  assert.equal(dietAllows(RECIPE_BY_ID["moong-dal-tadka"], [kid({ diet: "jain" })]), true);
});

const post = (over: Partial<CommunityPost> = {}): CommunityPost => ({
  ...SAMPLE_POSTS[0],
  status: "approved",
  ...over,
});

test("community tips: unconfirmed allergens are hidden from kids with allergies only", () => {
  const unconfirmed = post({ allergensConfirmed: false });
  assert.equal(checkPost(unconfirmed, [kid({ allergies: ["egg"] })]).ok, false);
  assert.equal(checkPost(unconfirmed, [kid()]).ok, true);
});

test("community tips: allergen overlap, age band and pending status", () => {
  assert.equal(checkPost(post({ allergenTags: ["sesame"] }), [kid({ allergies: ["sesame"] })]).ok, false);
  assert.equal(checkPost(post({ ageBand: "4-8" }), [kid({ ageBand: "1-3" })]).ok, false);
  assert.equal(checkPost(post({ ageBand: "1-3" }), [kid({ ageBand: "9-12" })]).ok, true);
  assert.equal(checkPost(post({ status: "pending" }), [kid()]).ok, false);
});

test("data integrity: ingredient ids, slots and swaps all resolve", () => {
  for (const recipe of RECIPES) {
    for (const ing of recipe.ingredients) {
      assert.ok(INGREDIENT_BY_ID[ing.id], `${recipe.id}: unknown ingredient ${ing.id}`);
    }
    for (const idx of Object.values(recipe.slots)) {
      assert.ok(idx! >= 0 && idx! < recipe.steps.length, `${recipe.id}: bad slot index ${idx}`);
    }
    for (const swap of recipe.swaps ?? []) {
      assert.ok(recipe.ingredients.some((i) => i.id === swap.replace), `${recipe.id}: swap target missing`);
      assert.ok(INGREDIENT_BY_ID[swap.with], `${recipe.id}: unknown swap ingredient`);
    }
  }
  for (const p of SAMPLE_POSTS) {
    assert.ok(RECIPE_BY_ID[p.recipeId], `sample post ${p.id}: unknown recipe`);
  }
});
