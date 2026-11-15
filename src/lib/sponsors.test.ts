import { test } from "node:test";
import assert from "node:assert/strict";
import type { SponsorOffer } from "../types.ts";
import { pickOffers } from "./sponsors.ts";

const base: SponsorOffer = {
  id: "a", store: "S1", ingredientId: "paneer", headline: "Fresh paneer",
  url: "https://s1.example/p", startsOn: "2026-11-01", endsOn: "2026-11-30", priority: 1,
};
const ctx = { allergies: [], diets: [], today: "2026-11-14" } as const;

test("shows a live offer for an ingredient on screen", () => {
  assert.equal(pickOffers([base], ["paneer"], { ...ctx, allergies: [], diets: [] }).length, 1);
});
test("never promotes an ingredient a kid is allergic to", () => {
  assert.equal(pickOffers([base], ["paneer"], { ...ctx, allergies: ["dairy"], diets: [] }).length, 0);
});
test("respects dates, https, and Jain diet", () => {
  const c = { ...ctx, allergies: [], diets: [] };
  assert.equal(pickOffers([base], ["paneer"], { ...c, today: "2026-12-01" }).length, 0);
  assert.equal(pickOffers([{ ...base, url: "http://x.example" }], ["paneer"], c).length, 0);
  assert.equal(pickOffers([{ ...base, ingredientId: "garlic" }], ["garlic"], { ...c, diets: ["jain"] }).length, 0);
});
test("highest priority wins, one per store", () => {
  const hi = { ...base, id: "b", store: "S2", priority: 5 };
  const dup = { ...base, id: "c", priority: 9, store: "S2" };
  const got = pickOffers([base, hi, dup], ["paneer"], { ...ctx, allergies: [], diets: [] }, 2);
  assert.deepEqual(got.map((o) => o.id), ["c", "a"]);
});
