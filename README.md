# Tiny Thali 🍛

**Same favorite food. Stronger in every bite.**

Tiny Thali turns what's in your fridge into Indian home-style recipes your kids will eat, then "boosts" each recipe with small, kid-safe nutrition upgrades: ragi or jowar flour in the dough, ground flax in dal, hemp hearts on an omelette, blended tofu in the atta.

### 🔗 Live demo

**[tiny-thali-tummy-treasures.lovable.app](https://tiny-thali-tummy-treasures.lovable.app)**

The live demo is the original prototype built with [Lovable](https://lovable.dev). This repository is a separate, hand-written implementation of the same product idea.

## Features

- **Fridge-first matching:** pick ingredients, get ranked recipes, plus "almost there" options missing one or two items.
- **Tiny Boosts:** 8 vetted add-ins and swaps. They attach to the right step of each recipe, and every boost shows what it adds and why.
- **Allergen-safe by design:** one tested module decides what is safe (see below).
- **Kid profiles:** age band, allergies, diet (vegetarian, eggetarian, non-veg, Jain) and a picky-eater flag. Select several kids and the app uses everyone's allergies and the youngest age.
- **Cook mode:** large, one-step-at-a-time view with boosts highlighted, then "Did your kid eat it?".
- **Saved recipes and history:** keeps the boosts you used, with "Cook again".
- **Community:** parents share their own boosts. Tips carry allergen tags, age bands, "Helpful" and "Kid approved" reactions, and a report button.

## How allergen safety works

All rules live in [`src/lib/safety.ts`](src/lib/safety.ts) and are covered by tests:

1. A boost containing any selected kid's allergen is never shown or applied.
2. A recipe with an allergen is excluded, unless every conflict has a defined swap (for example paneer to tofu for dairy) whose replacement is also safe for every selected kid.
3. Community tips with unconfirmed allergen info are hidden from any kid with an allergy.
4. Boosts and tips are hidden when they are meant for older kids than the youngest selected age band.
5. Ghee is treated as replaceable with oil, with a note shown on dairy-free recipes.

Allergens are computed from a single ingredient table ([`src/data/ingredients.ts`](src/data/ingredients.ts)), so each ingredient is tagged once.

## Run locally

```bash
npm install
npm run dev        # start the app
npm test           # unit tests for matching, boosts and allergen safety
npm run build      # type-check and production build
```

Requires Node 22 or newer. Built with React, TypeScript, Vite, Tailwind CSS v4 and React Router. Data is stored in the browser's `localStorage`, so there is no backend to set up.

## Project structure

```
src/
  data/       ingredients, recipes, boosts, sample community tips
  lib/        safety.ts, match.ts, boosts.ts (pure, tested logic)
  state/      app state, persisted to localStorage
  components/ shared UI, kid form, layout and navigation
  pages/      Fridge, Results, Recipe, Cook, Saved, Community, Share, Profile
```

## Status and roadmap

This is a prototype. Today everything stays on the device, and the community feed shows sample tips plus your own pending submissions.

- [ ] Email sign-in and cloud-synced saved recipes (Supabase)
- [ ] Shared community feed with moderation tools and reaction counts
- [ ] Claude-powered recipe adaptation for unusual fridge contents, keeping boost rules deterministic
- [ ] Weekly planner and grocery list
- [ ] Native iOS and Android apps

## Safety note

Tiny Thali offers general ideas, not medical advice. Always check packaged ingredient labels, talk to your pediatrician about allergies or feeding concerns, and grind seeds for kids under 4 to avoid choking. The starter boost amounts and age limits in [`src/data/boosts.ts`](src/data/boosts.ts) are conservative defaults and **must be reviewed by a pediatric dietitian before wider release.**
