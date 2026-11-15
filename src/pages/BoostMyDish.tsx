import { useEffect, useState } from "react";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { Card, cx, NutrientBadges, PageTitle } from "../components/ui.tsx";
import { logDishRequest } from "../lib/cloud.ts";
import { boostsForDish, detectDish, dishToLog, suggestDishes } from "../lib/dish.ts";
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
  const settled = detected && suggestions.length === 0 ? detected : null;
  const result = settled ? boostsForDish(settled, activeKids) : null;
  const [first, ...rest] = result?.allowed ?? [];

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
      <PageTitle title="Boost what you're cooking" subtitle="Tell us the dish. We'll tell you what to add." />
      <KidSwitcher />

      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. paneer paratha, moong dal, pasta"
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

      {!detected && suggestions.length === 0 && query.trim().length >= 2 && (
        <p className="text-sm text-ink-soft">Not sure what that is. Try a simpler name, like roti or pasta.</p>
      )}

      {settled && result && (
        <section key={settled.id} className="fade-in space-y-3" aria-live="polite">
          <h2 className="text-xl font-extrabold">
            {settled.emoji} Boosts for {settled.label.toLowerCase()}
          </h2>

          {first ? (
            <Card className="bg-spinach-soft ring-2 ring-spinach">
              <p className="text-xs font-extrabold uppercase tracking-wide text-spinach">Easiest boost</p>
              <h3 className="text-lg font-extrabold">
                <Glyph kind="boost" id={first.id} emoji={first.emoji} size="1.5em" /> {first.name}
              </h3>
              <p className="mt-1">
                Add <strong>{first.add}</strong>: {first.amount}
              </p>
              <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-bold">✨ {first.stepText}</p>
              {first.badges.length > 0 && (
                <div className="mt-2">
                  <NutrientBadges badges={first.badges} />
                </div>
              )}
            </Card>
          ) : (
            <p className="text-sm text-ink-soft">No boosts fit this dish for these kids.</p>
          )}

          {rest.length > 0 && <h3 className="pt-1 text-lg font-extrabold">More ideas</h3>}
          {rest.map((b) => (
            <details key={b.id} className={cx("rounded-2xl bg-white p-3 ring-1 ring-black/10")}>
              <summary className="cursor-pointer font-bold">
                <Glyph kind="boost" id={b.id} emoji={b.emoji} /> {b.name} <span className="font-normal text-ink-soft">· {b.amount}</span>
              </summary>
              <p className="mt-2 text-sm font-bold">✨ {b.stepText}</p>
              <p className="mt-1 text-sm text-ink-soft">{b.why}</p>
              {b.badges.length > 0 && (
                <div className="mt-2">
                  <NutrientBadges badges={b.badges} />
                </div>
              )}
              <p className="mt-2 text-xs text-ink-soft">{b.note}</p>
            </details>
          ))}

          <p className="text-xs text-ink-soft">Best added {settled.when}.</p>
          {result.hiddenCount > 0 && (
            <p className="text-xs text-ink-soft">
              {result.hiddenCount} boost{result.hiddenCount === 1 ? "" : "es"} hidden for allergy or age reasons.
            </p>
          )}
        </section>
      )}

    </div>
  );
}
