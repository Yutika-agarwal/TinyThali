import { useEffect, useState } from "react";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { NutrientBadges, PageTitle } from "../components/ui.tsx";
import { logDishRequest } from "../lib/cloud.ts";
import { collapseGroups, groupBoosts } from "../lib/boosts.ts";
import { Link } from "react-router-dom";
import { otherAllergyHit } from "../lib/safety.ts";
import { boostsForDish, detectDish, dishToLog, isMeatDish, suggestDishes } from "../lib/dish.ts";
import { useApp } from "../state/AppState.tsx";
import Glyph from "../components/Glyph.tsx";

const loggedDishes = new Set<string>();

/** "I'm cooking...": say what you're making, get quick boosts to add. No recipe needed. */
export default function BoostMyDish() {
  const { activeKids } = useApp();
  const [query, setQuery] = useState("");

  const detected = detectDish(query);
  const suggestions = suggestDishes(query);
  // Boosts appear once the dish is settled: nothing while the field is empty, nothing while suggestions are still open.
  const typedOther = otherAllergyHit(query, activeKids);
  const settled = detected && suggestions.length === 0 && !typedOther ? detected : null;
  const result = settled ? boostsForDish(settled, activeKids) : null;
  const [showAll, setShowAll] = useState(false);
  const list = result?.allowed ?? [];
  const groups = groupBoosts(list);
  const shownGroups = showAll ? groups : collapseGroups(groups);
  const shownCount = shownGroups.reduce((n, g) => n + g.items.length, 0);

  // Once they pause typing, remember the dish name (text only, nothing about them) so we can add it to the menu.
  useEffect(() => {
    const dish = dishToLog(query);
    if (!dish) return;
    const t = setTimeout(() => {
      if (loggedDishes.has(dish)) return;
      loggedDishes.add(dish);
      logDishRequest(dish, detectDish(dish) !== null).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-5">
      <PageTitle title="What are you cooking?" />
      <KidSwitcher />

      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. moong dal chilla"
          aria-label="What are you cooking?"
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl bg-white px-4 text-lg ring-1 ring-black/10"
        />
        {suggestions.length > 0 && (
          <ul className="mt-1 overflow-hidden rounded-2xl bg-white ring-1 ring-black/10" aria-label="Suggestions">
            {suggestions.map((n) => (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => setQuery(n)}
                  className="min-h-11 w-full px-4 py-2 text-left font-bold active:bg-turmeric-soft"
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {typedOther && (
        <p className="text-sm font-bold text-beet">This mentions {typedOther}, which is on your allergy list. No boosts shown.</p>
      )}
      {isMeatDish(query) && (
        <p className="text-sm text-ink-soft">We only suggest boosts for vegetarian dishes and eggs for now.</p>
      )}
      {!detected && !isMeatDish(query) && suggestions.length === 0 && query.trim().length >= 2 && (
        <p className="text-sm text-ink-soft">Not sure what that is. Try a simpler name, like roti or pasta.</p>
      )}

      {settled && result && (
        <section key={settled.id} className="fade-in space-y-3" aria-live="polite">
          <h2 className="text-xl font-extrabold">
            Boosts for {query.trim().replace(/\s+/g, " ")}
          </h2>

          {list.length === 0 && <p className="text-sm text-ink-soft">No boosts fit this dish for these kids.</p>}
          {shownGroups.map((g) => (
            <div key={g.kind} className="space-y-2">
              <h3 className="pt-1 text-xs font-extrabold uppercase tracking-wide text-ink-soft">{g.label}</h3>
              {g.items.map((b) => (
                <details key={b.id} open={b.id === list[0].id} className="rounded-2xl bg-white p-3 ring-1 ring-black/10">
                  <summary className="min-h-9 cursor-pointer font-bold">
                    <Glyph kind="boost" id={b.id} emoji={b.emoji} /> {b.name}
                  </summary>
                  <p className="mt-2 rounded-xl bg-spinach-soft px-3 py-2 text-sm font-bold">✨ {b.stepText}</p>
                  <p className="mt-2 text-sm text-ink-soft">{b.why}</p>
                  {b.badges.length > 0 && (
                    <div className="mt-2">
                      <NutrientBadges badges={b.badges} />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-ink-soft">{b.note}</p>
                </details>
              ))}
            </div>
          ))}
          {list.length > shownCount && (
            <button type="button" onClick={() => setShowAll(true)} className="min-h-11 w-full text-sm font-extrabold text-beet">
              Show {list.length - shownCount} more
            </button>
          )}
        </section>
      )}

      <Link to="/community" className="block min-h-11 text-center text-sm font-extrabold text-beet">Tips from other parents →</Link>
    </div>
  );
}
