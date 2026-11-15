import { test } from "node:test";
import assert from "node:assert/strict";
import type { KidProfile } from "../types.ts";
import { RECIPE_BY_ID, RECIPES } from "../data/recipes.ts";
import { matchRecipes } from "./match.ts";
import { checkRecipe, recipeAllergens } from "./safety.ts";
import { pageResults } from "./match.ts";
import type { MatchResult } from "./match.ts";
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
  ageBands: ["4-8"],
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
    kid({ ageBands: ["1-3"], allergies: ["sesame", "soy"] }),
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
  assert.ok(!visibleBoosts(r, [kid({ ageBands: ["1-3"] })]).allowed.some((b) => b.id === "date-sugar"));
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

import { autoBoosts } from "./boosts.ts";

test("Boost it for me: small, safe, no duplicates", () => {
  const r = RECIPE_BY_ID["aloo-paratha"];
  const picks = autoBoosts(r, [kid({ ageBands: ["1-3"] })]);
  assert.ok(picks.length >= 1 && picks.length <= 2);
  const allowed = visibleBoosts(r, [kid({ ageBands: ["1-3"] })]).allowed.map((b) => b.id);
  assert.ok(picks.every((id) => allowed.includes(id)));
  const groups = picks.map((id) => BOOST_BY_ID[id].exclusiveGroup).filter(Boolean);
  assert.equal(new Set(groups).size, groups.length);
});

test("Boost it for me respects allergies", () => {
  const r = RECIPE_BY_ID["aloo-paratha"];
  const picks = autoBoosts(r, [kid({ allergies: ["soy", "sesame"] })]);
  assert.ok(!picks.includes("tofu-dough") && !picks.includes("sesame"));
});

import { validateDetected } from "./photo.ts";

test("photo scan keeps only known, non-pantry ingredient ids", () => {
  assert.deepEqual(validateDetected(["potato", "spinach", "potato", "salt", "unicorn", 5, null]), ["potato", "spinach"]);
  assert.deepEqual(validateDetected("potato"), []);
});

test("cottage cheese boosts: dairy-safe, sauce slot, hidden when already in the recipe", () => {
  const palak = RECIPE_BY_ID["palak-paneer"];
  assert.ok(visibleBoosts(palak, [kid()]).allowed.some((b) => b.id === "cc-creamy"));
  assert.ok(!visibleBoosts(palak, [kid({ allergies: ["dairy"] })]).allowed.some((b) => b.id.startsWith("cc-")));
  const roti = RECIPE_BY_ID["cottage-cheese-roti"];
  assert.ok(!visibleBoosts(roti, [kid()]).allowed.some((b) => b.id === "cc-dough"));
  assert.ok(visibleBoosts(RECIPE_BY_ID["aloo-paratha"], [kid()]).allowed.some((b) => b.id === "cc-dough"));
});

test("white sauce pasta: dairy swap, and tofu sauce is a boost alternative", () => {
  const r = RECIPE_BY_ID["white-sauce-pasta"];
  assert.equal(checkRecipe(r, [kid({ allergies: ["dairy"] })]).status, "swap");
  assert.ok(visibleBoosts(r, [kid()]).allowed.some((b) => b.id === "tofu-creamy"));
  assert.ok(!visibleBoosts(r, [kid({ allergies: ["soy"] })]).allowed.some((b) => b.id === "tofu-creamy"));
});

test("hummus: extra sesame boost hidden for sesame allergy, tahini swapped", () => {
  const h = RECIPE_BY_ID["hummus"];
  assert.ok(visibleBoosts(h, [kid()]).allowed.some((b) => b.id === "sesame-blend"));
  assert.ok(!visibleBoosts(h, [kid({ allergies: ["sesame"] })]).allowed.some((b) => b.id === "sesame-blend"));
  assert.equal(checkRecipe(h, [kid({ allergies: ["sesame"] })]).status, "swap");
});

import { boostsForDish, suggestDishes, detectDish, dishToLog, isMeatDish } from "./dish.ts";

test("Boost my dish: detects the dish type from free text", () => {
  assert.equal(detectDish("Paneer paratha")?.id, "stuffed");
  assert.equal(detectDish("moong dal tadka")?.id, "dal");
  assert.equal(detectDish("palak paneer")?.id, "dal");
  assert.equal(detectDish("veg pasta")?.id, "pasta");
  assert.equal(detectDish("besan chilla")?.id, "batter");
  assert.equal(detectDish("rajma tikki burger")?.id, "wrap");
  assert.equal(detectDish("zzz"), null);
});

test("Boost my dish: safe, ranked, one per exclusive group", () => {
  const dough = detectDish("roti")!;
  const all = boostsForDish(dough, [kid({ ageBands: ["4-8"] })]);
  assert.ok(all.allowed.length > 0);
  const groups = all.allowed.map((b) => b.exclusiveGroup).filter((g) => g && g !== "dough-add");
  assert.equal(new Set(groups).size, groups.length);
  assert.equal(all.allowed.filter((b) => b.exclusiveGroup === "dough-add").length, 4);
  const soy = boostsForDish(dough, [kid({ allergies: ["soy", "dairy", "sesame"] })]);
  assert.ok(!soy.allowed.some((b) => b.allergens.some((a) => ["soy", "dairy", "sesame"].includes(a))));
  assert.ok(soy.hiddenCount > 0);
  const toddler = boostsForDish(detectDish("halwa")!, [kid({ ageBands: ["1-3"] })]);
  assert.ok(!toddler.allowed.some((b) => b.minAge > 1));
});

import { dollarsToCents } from "./donate.ts";

test("donation amounts: valid dollars become cents, junk is rejected", () => {
  assert.equal(dollarsToCents("5"), 500);
  assert.equal(dollarsToCents("$7.50"), 750);
  assert.equal(dollarsToCents("1,000"), null);
  assert.equal(dollarsToCents("0.50"), null);
  assert.equal(dollarsToCents("-5"), null);
  assert.equal(dollarsToCents("abc"), null);
  assert.equal(dollarsToCents("500"), 50000);
  assert.equal(dollarsToCents("500.01"), null);
});

test("dish suggestions are predictive and only offer dishes we can boost", () => {
  assert.deepEqual(suggestDishes("p"), []);
  const s = suggestDishes("paneer par");
  assert.ok(s.length > 0 && s.every((n) => detectDish(n) !== null));
  assert.ok(suggestDishes("pas").some((n) => n.toLowerCase().includes("pasta")));
  assert.deepEqual(suggestDishes("pasta"), []); // an exact pick closes the list
});

test("only plain dish names are kept for menu research", () => {
  assert.equal(dishToLog("  Paneer   Paratha "), "paneer paratha");
  assert.equal(dishToLog("hi"), null);
  assert.equal(dishToLog("call me 555 1234"), null);
  assert.equal(dishToLog("me@x.com"), null);
});

test("colourful atta boosts: one at a time, none for Jain, hidden when the recipe has it", () => {
  const roti = RECIPES.find((r) => visibleBoosts(r, [kid()]).allowed.some((b) => b.id === "spinach-dough"));
  if (!roti) throw new Error("a dough recipe should offer spinach in atta");
  const ids = ["spinach-dough", "carrot-dough", "beet-dough", "dal-dough"];
  const picked = ids.reduce<string[]>((sel, id) => toggleBoost(sel, id), []);
  assert.deepEqual(picked, ["dal-dough"]); // each replaces the last
  const jain = visibleBoosts(roti, [kid({ diet: "jain" })]).allowed.map((b) => b.id);
  assert.ok(!jain.includes("carrot-dough") && !jain.includes("beet-dough"));
  assert.ok(jain.includes("spinach-dough") && jain.includes("dal-dough"));
  const beetParatha = RECIPES.find((r) => r.ingredients.some((i) => i.id === "beetroot") && r.slots.dough !== undefined);
  if (beetParatha) assert.ok(!visibleBoosts(beetParatha, [kid()]).allowed.some((b) => b.id === "beet-dough"));
});

test("results pages: at most 5 at once, at most 3 almost on the first page, See more adds 5", () => {
  const mk = (kind: "ready" | "almost", n: number) =>
    Array.from({ length: n }, (_, i) => ({ kind, recipe: { id: `${kind}${i}` } }) as unknown as MatchResult);
  const first = pageResults([...mk("ready", 2), ...mk("almost", 6)], 1);
  assert.equal(first.ready.length, 2);
  assert.equal(first.almost.length, 3);
  assert.ok(first.hasMore);
  const second = pageResults([...mk("ready", 2), ...mk("almost", 6)], 2);
  assert.equal(second.ready.length + second.almost.length, 8);
  assert.ok(!second.hasMore);
  const lots = pageResults([...mk("ready", 9), ...mk("almost", 4)], 1);
  assert.equal(lots.ready.length, 5);
  assert.equal(lots.almost.length, 0);
});

test("filling boosts only show when the dish is actually stuffed", () => {
  const ids = (q: string) => boostsForDish(detectDish(q)!, []).allowed.map((b) => b.id);
  assert.ok(!ids("pasta").includes("cc-filling") && !ids("pasta").includes("soy-chunks"));
  assert.ok(!ids("roti").includes("cc-filling"));
  assert.equal(detectDish("ravioli")!.id, "stuffed");
  assert.equal(detectDish("aloo paratha")!.id, "stuffed");
  assert.ok(ids("ravioli").includes("cc-filling"));
  assert.ok(ids("pulao").includes("soy-chunks"));
});

test("dish detection: head of the name wins, whole words only, never guesses on meat or odd names", () => {
  const type = (q: string) => detectDish(q)?.id ?? null;
  assert.equal(type("masala dosa"), "batter");
  assert.equal(type("masala oats"), "upma");
  assert.equal(type("paneer bhurji"), "stirfry");
  assert.equal(type("sweet corn soup"), "soup");
  assert.equal(type("sweet potato fries"), null); // never "sweet": no date sugar on fries
  assert.equal(type("sourdough toast"), "toast"); // "dough" inside "sourdough" is not a roti
  assert.equal(type("dalia"), "upma"); // "dal" inside "dalia" is not a dal
  assert.equal(type("moong dal chilla"), "batter");
  assert.equal(type("chole bhature"), "roti");
  assert.equal(type("paneer tikka"), null); // not sure beats a wrong guess
  assert.equal(type("chicken curry"), null);
  assert.ok(isMeatDish("Chicken curry") && !isMeatDish("chickpea curry"));
  assert.deepEqual(suggestDishes("chicken"), []);
});

test("every recipe name resolves to a dish type that shares a step with the recipe", () => {
  for (const r of RECIPES) {
    const d = detectDish(r.name);
    if (!d) throw new Error(`${r.name} should be recognised`);
    assert.ok(d.slots.some((s) => s in r.slots), `${r.name} was read as ${d.id}`);
  }
});

test("boosts match the dish: dips with wraps, no whipped toppings on quesadilla, no peanut butter in dosa", () => {
  const ids = (q: string) => boostsForDish(detectDish(q)!, []).allowed.map((b) => b.id);
  const quesadilla = ids("quesadilla");
  assert.equal(quesadilla[0], "cc-cilantro-dip"); // the dip leads
  assert.ok(!quesadilla.includes("tofu-topping") && !quesadilla.includes("cc-topping") && !quesadilla.includes("hemp"));
  assert.ok(ids("besan chilla").includes("cc-cilantro-dip"));
  assert.ok(!ids("pancakes").includes("cc-cilantro-dip")); // no cilantro dip with sweet pancakes
  assert.ok(ids("pancakes").includes("peanut-butter") && !ids("masala dosa").includes("peanut-butter"));
  assert.ok(!ids("pancakes").includes("ajwain") && ids("roti").includes("ajwain"));
  assert.ok(ids("tomato soup").includes("tofu-topping") && ids("avocado toast").includes("cc-topping"));
  assert.ok(!ids("aloo gobi").includes("cc-filling")); // no "filling" in a sabzi
});

test("recipe pages follow the same dish rules", () => {
  const on = (rid: string) => boostsForRecipe(RECIPE_BY_ID[rid]).map((b) => b.id);
  assert.ok(!on("besan-chilla").includes("peanut-butter"));
  assert.ok(!on("veg-quesadilla").includes("tofu-topping"));
  assert.ok(on("veg-quesadilla").includes("cc-cilantro-dip") && on("veg-quesadilla").includes("tofu-herb-dip"));
  assert.ok(on("creamy-veg-soup").includes("tofu-topping"));
});

test("trust check: a recipe never mentions an allergen food its allergen list doesn't declare", () => {
  const words: Record<string, RegExp> = {
    dairy: /\b(milk|paneer|cheese|yogh?urt|curd|raita|(?<!peanut )butter|whey|cottage|cream|dahi|khoya)\b/i,
    soy: /\b(soy|soya|tofu|edamame|nutrela)\b/i,
    tree_nuts: /\b(almond|cashew|walnut|pistachio|pine nut)\b/i,
    sesame: /\b(sesame|tahini)\b/i,
    peanuts: /\bpeanut/i,
    egg: /\beggs?\b/i,
  };
  for (const r of RECIPES) {
    const declared = new Set<string>(recipeAllergens(r));
    const text = [r.name, r.blurb, ...r.steps].join(" | ");
    for (const [allergen, re] of Object.entries(words)) {
      if (re.test(text) && !declared.has(allergen)) assert.fail(`${r.name} mentions ${allergen} (${text.match(re)?.[0]}) but does not declare it`);
    }
  }
});
