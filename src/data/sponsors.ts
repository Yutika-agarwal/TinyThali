import type { SponsorOffer } from "../types.ts";

/**
 * DEMO offers only (fictional stores). Real offers come from the `sponsor_offers`
 * table (see supabase/migrations/0003_sponsors.sql) once Supabase is connected.
 */
export const DEMO_OFFERS: SponsorOffer[] = [
  { id: "demo-1", store: "Demo Fresh Mart", ingredientId: "spinach", headline: "Fresh palak, this week's price", url: "https://example.com/palak", startsOn: "2026-01-01", endsOn: "2026-12-31", priority: 1 },
  { id: "demo-2", store: "Demo Desi Bazaar", ingredientId: "paneer", headline: "Fresh paneer, 2 for 1", url: "https://example.com/paneer", startsOn: "2026-01-01", endsOn: "2026-12-31", priority: 1 },
];
