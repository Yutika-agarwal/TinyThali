# Deploy the MVP (about 10 minutes)

The MVP needs no backend and no keys. Everything stays on the device.

## Vercel (recommended)
1. vercel.com → Add New → Project → import `Yutika-agarwal/tinythali`.
2. Set **Production Branch** to `mvp` (Settings → Git).
3. Framework: Vite. Build `npm run build`, output `dist`. (Already in `vercel.json`: all routes fall back to `index.html`.)
4. Deploy. Open the URL on your phone and run the checklist below.

Netlify works the same way: `public/_redirects` already handles routing.

## Before sharing the link
- [ ] Add a real contact email in `src/pages/Legal.tsx` (search `[your contact email here]`).
- [ ] Fridge → add 3 ingredients → pick a recipe → apply a Boost → Cook → "loved" → Saved.
- [ ] Add a child with an allergy and confirm unsafe recipes and boosts never show.
- [ ] Try the mic in Chrome and Safari (it quietly hides where unsupported).
- [ ] Dietitian, lawyer and taste-test reviews: see `docs/DIETITIAN-REVIEW.md`, `docs/TASTE-TEST.md`.

## Later: turn on the full app
Flip flags in `src/config/features.ts`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment variables, and deploy the edge functions with their secrets (Stripe, Anthropic). The database is already created in Supabase.
