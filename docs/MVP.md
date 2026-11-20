# MVP

The `mvp` branch is the smallest version that proves the idea, and it needs **no backend, no accounts and no API keys**.

**The loop:** kid profile (allergies, age, diet, picky) → say, type or pick ingredients → safe recipes (max 5, 20-minute filter) → Tiny Boosts → cook (hands-free optional) → "loved it / not this time" → save.

**In the MVP:** 55 recipes, 37 boosts, 22 dish types, the Boost tab for typed dishes, batch sizes, shopping-list copy, hearts and a Saved tab, voice input, privacy and terms pages. Everything is stored on the device.

**Switched off** (code still there, flags in `src/config/features.ts`): community tips, sign-in and sync, pay-what-you-want support, grocery sponsor slots, AI ideas and photo scan.

**What the MVP is trying to learn**
1. Do parents get to a safe recipe in the first session?
2. Do they switch a boost on, and do kids still eat the dish ("loved" rate on boosted vs unboosted)?
3. Do they come back in week 2?

**Before real families use it:** dietitian review of `docs/DIETITIAN-REVIEW.md`, lawyer pass on the privacy and terms pages (they still mention features that are off), and a taste test with the sheet in `docs/TASTE-TEST.md`.

**Switching things back on:** flip a flag. The `main` branch has everything on.
