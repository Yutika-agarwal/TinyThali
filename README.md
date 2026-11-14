# Tiny Thali 🍛

**Same favorite food. Stronger in every bite.**

Tiny Thali turns what's in your fridge into Indian home-style recipes your kids will eat, then "boosts" each recipe with small, kid-safe nutrition upgrades: ragi or jowar flour in the dough, ground flax in dal, hemp hearts on an omelette, blended tofu in the atta.

### 🔗 Live demo

**[tiny-thali-tummy-treasures.lovable.app](https://tiny-thali-tummy-treasures.lovable.app)**

The live demo is the original prototype built with [Lovable](https://lovable.dev). This repository is a separate, hand-written implementation of the same product idea.

## Features

- **Fridge-first matching:** pick ingredients, get ranked recipes, plus "almost there" options missing one or two items.
- **Tiny Boosts:** 16 vetted add-ins and swaps (flours, seeds, ajwain, date sugar, quinoa for rice, shredded soy chunks, paneer whey in dough, peanut butter in batters). They attach to the right step of each recipe, and every boost shows what it adds and why.
- **Recipes:** parathas, dals (moong, masoor, spinach, kale, methi), waffles (sabudana, moong), rajma-quinoa patties, spinach pesto pasta, makhana raita, cream cheese roti pinwheels and more.
- **Allergen-safe by design:** one tested module decides what is safe (see below).
- **Kid profiles:** age band, allergies, diet (vegetarian, eggetarian, non-veg, Jain) and a picky-eater flag. Select several kids and the app uses everyone's allergies and the youngest age.
- **One-tap helpers:** "Boost it for me" picks a small, safe set of boosts in one tap; "Quick picks" shows the ingredients you add most; cook mode keeps the screen awake.
- **Cook mode:** large, one-step-at-a-time view with boosts highlighted, then "Did your kid eat it?".
- **Saved recipes and history:** keeps the boosts you used, with "Cook again".
- **More from your fridge (optional, needs accounts):** AI-written recipe ideas from only your ingredients. Kid profiles never leave the device; only allergen-safe ingredient ids are sent, and every idea is re-checked against the allergy list before it is shown. Deploy with `supabase functions deploy suggest-recipes` and `supabase secrets set ANTHROPIC_API_KEY=...`.
- **Snap your fridge (optional, needs accounts):** take a photo, the AI suggests ingredients from our own list, you confirm, and they go to your fridge. Photos are downscaled on device and not stored. Deploy with `supabase functions deploy identify-ingredients`.
- **Community:** parents share their own boosts. Tips carry allergen tags, age bands, "Helpful" and "Kid approved" reactions, and a report button.
- **Accounts (optional):** email and password, or a magic link. Saved recipes and cooking history sync across devices. Kid profiles never leave the device.
- **Moderation:** tips are reviewed before they appear. Admins approve, reject with a reason, and handle reports.

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

Requires Node 22 or newer. Built with React, TypeScript, Vite, Tailwind CSS v4 and React Router.

Out of the box the app runs in **local-only mode**: no accounts, and everything is stored in the browser's `localStorage`. To turn on accounts and the shared community, see below.

## Turn on accounts and the shared community (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL editor**, paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and run it. It creates the tables, row-level security policies, and the server-side guardrails.
3. Copy `.env.example` to `.env.local` and fill in your project URL and anon key (**Project settings → API**).
4. In **Authentication → Providers**, keep Email enabled with **Confirm email** on. Add your site URL (for example `http://localhost:5173`) under **Authentication → URL Configuration**.
5. Create your account in the app, then make yourself an admin by running this in the SQL editor:

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com';
   ```

6. Restart `npm run dev`. A **Sign in** button appears, and admins get a moderation page under Profile.

**What is stored:** account email, display name, saved recipes, cooking history, community tips and reactions. **What is never uploaded:** kid nicknames, ages and allergies.

**Rules enforced by the database** (not just the app): tips start as pending and need admin approval, you need a confirmed email to post, up to 5 tips per day, health claims like "cures" or "treats" are rejected, and the public author name comes from your profile so it can't be spoofed.

## Project structure

```
src/
  data/       ingredients, recipes, boosts, sample community tips
  lib/        safety.ts, match.ts, boosts.ts (pure, tested logic)
  state/      app state (localStorage plus optional cloud sync) and sign-in state
  components/ shared UI, kid form, layout and navigation
  pages/      Fridge, Results, Recipe, Cook, Saved, Community, Share, Profile, Login, Admin
supabase/
  migrations/ database schema, row-level security and guardrails
```

## Status and roadmap

This is a prototype. The accounts, shared community and moderation code is written but has not yet been run against a live Supabase project, so expect to fix small setup issues the first time you connect one.

- [x] Allergen-safe recipe matching and boosts, with tests
- [x] Email sign-in, synced saved recipes, shared community and moderation (needs Supabase keys)
- [ ] Real-project test pass of the Supabase setup and the row-level security policies
- [x] AI recipe ideas from the fridge, with deterministic safety re-checks (untested against a live project)
- [ ] Weekly planner and grocery list
- [ ] Native iOS and Android apps

## Safety note

Tiny Thali offers general ideas, not medical advice. Always check packaged ingredient labels, talk to your pediatrician about allergies or feeding concerns, and grind seeds for kids under 4 to avoid choking. The starter boost amounts and age limits in [`src/data/boosts.ts`](src/data/boosts.ts) are conservative defaults and **must be reviewed by a pediatric dietitian before wider release.**
