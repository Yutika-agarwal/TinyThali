# Lane: content

**Owns:** `src/data/recipes.ts`, `dishes.ts`, `ingredients.ts`, `weekly.ts`, `icons.ts`; boosts **except** nutrient badges and amounts.
**Needs the human:** badges, doses, anything medical; new boosts for children under 1.

## House rules
- Indian home-style, vegetarian or egg only.
- Boosts must fit the dish: no white sauce on chole or noodles, no ajwain on chole, no filling boosts on plain pasta, no tofu topping on quesadilla.
- Recipes only use ingredients already in ingredients.ts; correct allergen swaps; run the tests (they audit names and allergens).
- Every new dish name or keyword gets a detection test.

## Next
1. Add meal tags (breakfast, lunch, dinner, snack, lunchbox) to every recipe, with a test that none is missing.
2. Add 3 to 5 everyday kid recipes per run (khichdi variants, thepla, poha, vegetable cutlet, idli upma).
3. Add dish names people type that say 'Not sure' (from the dish_requests list the lead pastes in TO-LEAD).

## Log
