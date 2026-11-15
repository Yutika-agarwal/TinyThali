# Daily improvement backlog

> Superseded by `docs/AGENTS.md` and `docs/agents/lanes/`. Kept for history.

Read by the daily scheduled run. Each run does ONE small item from "Next", tests it, pushes, and logs it below.

## Rules for the daily run (keep tokens low)
- Read only this file, then only the files an item names. Do not explore the repo or re-audit it.
- One item per day, small diff. If nothing safe fits, push nothing and add one line to the log.
- Prefer changes in `src/lib` and `src/data` that `node --test "src/lib/*.test.ts"` can check. Add or update a test for every change.
- Never loosen allergen, diet, age or other-allergy checks. Never add nutrient claims or badges, dosing, or medical text. Anything like that goes under "Needs a person" instead of being built.
- No new dependencies, secrets or network calls. Packages cannot be installed in the workspace.
- Tests must pass before pushing. If they fail and the fix is not obvious, revert and log the item as blocked.
- Commit message ends with the two attribution lines from the session. Push to `main`.
- After each run, move the item to the log with the date and the commit id.

## Next (in order)
1. Meal-type tags on recipes (breakfast, lunch, dinner, snack, lunchbox) in `src/data/recipes.ts` and a "Lunchbox / tiffin" chip on Results (like the "20 min or less" chip). Test that every recipe has a tag.
2. Save a typed dish with its boosts from the Boost tab (a heart next to the dish field; store dish text plus boost ids in the Saved list).
3. Add 3 to 5 more everyday Indian kid recipes per run, only from ingredients already in `ingredients.ts`, with correct allergen swaps. The existing tests audit names and allergens.
4. Add common dish names people type (see `dishes.ts` keywords) that currently say "Not sure", one dish type or keyword at a time, each with a detection test.
5. Saved tab: show the date cooked and last reaction on each saved recipe.
6. Accessibility: check every icon-only button has an aria-label, and every input has a label.

## Needs a person (do not build)
- Dietitian review of `docs/DIETITIAN-REVIEW.md` and nutrient badges.
- Age-specific choking notes inside recipe steps (needs pediatric review).
- Licensed recipe photos, Stripe, Supabase and Anthropic keys, lawyer and trademark review.

## Log
- 2026-11-15: backlog created.
