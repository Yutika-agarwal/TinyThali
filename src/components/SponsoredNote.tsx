import { useEffect, useState } from "react";
import { DEMO_OFFERS } from "../data/sponsors.ts";
import { fetchOffers } from "../lib/cloud.ts";
import { cloudEnabled } from "../lib/supabase.ts";
import { combinedAllergies } from "../lib/safety.ts";
import { pickOffers } from "../lib/sponsors.ts";
import { useApp } from "../state/AppState.tsx";
import type { SponsorOffer } from "../types.ts";

/**
 * One small, clearly labelled store offer under the ingredient list. Never shown while cooking,
 * never for an ingredient a selected kid can't have, and it only opens a link: no kid data leaves the app.
 */
export default function SponsoredNote({ ingredientIds }: { ingredientIds: string[] }) {
  const { activeKids } = useApp();
  const [offers, setOffers] = useState<SponsorOffer[]>(cloudEnabled ? [] : DEMO_OFFERS);

  useEffect(() => {
    if (!cloudEnabled) return;
    let alive = true;
    fetchOffers().then((o) => alive && setOffers(o)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const ctx = {
    allergies: combinedAllergies(activeKids),
    diets: activeKids.map((k) => k.diet),
    today: new Date().toLocaleDateString("en-CA"),
  };
  const [offer] = pickOffers(offers, ingredientIds, ctx, 1);
  if (!offer) return null;

  return (
    <a
      href={offer.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="mt-2 flex min-h-11 items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 text-sm ring-1 ring-black/10"
    >
      <span className="min-w-0">
        <span className="mr-2 rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
          Sponsored
        </span>
        <strong>{offer.store}</strong>: {offer.headline}
      </span>
      <span aria-hidden className="text-beet">↗</span>
    </a>
  );
}
