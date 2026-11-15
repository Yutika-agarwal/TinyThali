import { useState } from "react";
import { Link } from "react-router-dom";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { Card, Chip, cx, NutrientBadges, PageTitle } from "../components/ui.tsx";
import { DISH_TYPES } from "../data/dishes.ts";
import type { DishType } from "../data/dishes.ts";
import { boostsForDish, detectDish } from "../lib/dish.ts";
import { useApp } from "../state/AppState.tsx";

/** "I'm cooking...": say what you're making, get quick boosts to add. No recipe needed. */
export default function BoostMyDish() {
  const { activeKids } = useApp();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<DishType | null>(null);

  const detected = picked ?? detectDish(query);
  const result = detected ? boostsForDish(detected, activeKids) : null;
  const [first, ...rest] = result?.allowed ?? [];

  return (
    <div className="space-y-5">
      <PageTitle title="Boost what you're cooking" subtitle="Tell us the dish. We'll tell you what to add." />
      <KidSwitcher />

      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPicked(null);
        }}
        placeholder="e.g. paneer paratha, moong dal, pasta"
        aria-label="What are you cooking?"
        className="min-h-12 w-full rounded-2xl bg-white px-4 text-lg ring-1 ring-black/10"
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Common dishes">
        {DISH_TYPES.map((d) => (
          <Chip
            key={d.id}
            active={detected?.id === d.id}
            onClick={() => {
              setPicked(d);
              setQuery("");
            }}
          >
            {d.emoji} {d.chip}
          </Chip>
        ))}
      </div>

      {!detected && query.trim().length >= 2 && (
        <p className="text-sm text-ink-soft">Not sure what that is. Tap the closest type above.</p>
      )}

      {detected && result && (
        <section className="space-y-3" aria-live="polite">
          <h2 className="text-xl font-extrabold">
            {detected.emoji} Boosts for {detected.label.toLowerCase()}
          </h2>

          {first ? (
            <Card className="bg-spinach-soft ring-2 ring-spinach">
              <p className="text-xs font-extrabold uppercase tracking-wide text-spinach">Easiest boost</p>
              <h3 className="text-lg font-extrabold">
                {first.emoji} {first.name}
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
                {b.emoji} {b.name} <span className="font-normal text-ink-soft">· {b.amount}</span>
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

          <p className="text-xs text-ink-soft">Best added {detected.when}.</p>
          {result.hiddenCount > 0 && (
            <p className="text-xs text-ink-soft">
              {result.hiddenCount} boost{result.hiddenCount === 1 ? "" : "es"} hidden for allergy or age reasons.
            </p>
          )}
        </section>
      )}

      <Link to="/" className="block text-center text-sm font-bold text-beet">
        No dish yet? Start from your fridge →
      </Link>
    </div>
  );
}
