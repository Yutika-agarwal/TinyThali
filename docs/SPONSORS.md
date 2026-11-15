# Grocery store placements

**What shoppers see:** one small "Sponsored" line under a recipe's ingredient list, e.g. "Demo Fresh Mart: Fresh palak, this week's price". It opens the store's page in a new tab.

**Rules built into the code (tested in `src/lib/sponsors.test.ts`)**
- Max one offer per recipe page. Never in cook mode.
- An offer is hidden if its ingredient conflicts with any selected kid's allergy or diet (Jain included).
- Only https links, headline up to 60 characters, active between start and end dates.
- Stores never receive user or kid data. The app only reads offers; there is no tracking.

**Adding a real offer:** apply `supabase/migrations/0003_sponsors.sql`, then add a row in the Supabase dashboard (table `sponsor_offers`) and set `approved = true` after you've reviewed it. Until Supabase is connected the app shows two fictional demo offers.

**Decide before launch (your call, not mine)**
- Pricing and how stores pay (flat weekly fee per ingredient is simplest; avoid per-click tracking for now).
- Whether stores can name a region (needs a location signal; skipped for privacy).
- Ad rules: no sugary or "kids' snack" products, no health claims, you approve every row.
- Disclosure wording and ad/privacy terms: have a lawyer check, since the audience is parents of young children.
