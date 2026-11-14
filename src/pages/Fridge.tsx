import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATEGORY_LABELS, INGREDIENTS, INGREDIENT_BY_ID } from "../data/ingredients.ts";
import PhotoScan from "../components/PhotoScan.tsx";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { btn, Card, Chip, cx, PageTitle } from "../components/ui.tsx";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { WEEKLY } from "../data/weekly.ts";
import { checkRecipe, combinedAllergies, dietAllows } from "../lib/safety.ts";
import { useApp } from "../state/AppState.tsx";

type Category = keyof typeof CATEGORY_LABELS;

export default function Fridge() {
  const { fridge, toggleFridge, clearFridge, activeKids, quickPicks } = useApp();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("veg");
  const [query, setQuery] = useState("");

  const allergies = combinedAllergies(activeKids);
  const weekly = WEEKLY.recipeIds
    .map((id) => RECIPE_BY_ID[id])
    .filter((r) => r && checkRecipe(r, activeKids).status !== "blocked" && dietAllows(r, activeKids));
  const q = query.trim().toLowerCase();
  const visible = INGREDIENTS.filter((i) => i.category !== "pantry").filter((i) =>
    q ? i.name.toLowerCase().includes(q) : i.category === category,
  );

  return (
    <div className="space-y-5">
      <PageTitle title="What's in your fridge?" subtitle="Tap what you have. We'll find a recipe." />
      <KidSwitcher />

      <PhotoScan />

      {weekly.length > 0 && (
        <section aria-label="This week's kid picks">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            This week's kid picks · {WEEKLY.label}
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {weekly.map((r) => (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="min-h-11 shrink-0 rounded-2xl bg-white px-3 py-2 text-sm font-extrabold ring-1 ring-black/10"
              >
                {r.emoji} {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">Quick picks</p>
        <div className="flex flex-wrap gap-2">
          {quickPicks.map((id) => {
            const i = INGREDIENT_BY_ID[id];
            if (!i) return null;
            const flagged = i.allergens.some((a) => allergies.includes(a));
            return (
              <Chip key={id} active={fridge.includes(id)} onClick={() => toggleFridge(id)}>
                {i.emoji} {i.name}
                {flagged && <span aria-label="on your allergy list"> ⚠️</span>}
              </Chip>
            );
          })}
        </div>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ingredients"
        aria-label="Search ingredients"
        className="min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10"
      />

      {!q && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Ingredient categories">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cx(
                "min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-extrabold",
                category === c ? "bg-turmeric text-ink" : "bg-white text-ink-soft ring-1 ring-black/10",
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {visible.length === 0 && <p className="text-sm text-ink-soft">Nothing matches "{query}".</p>}
        {visible.map((i) => {
          const flagged = i.allergens.some((a) => allergies.includes(a));
          return (
            <Chip key={i.id} active={fridge.includes(i.id)} onClick={() => toggleFridge(i.id)}>
              {i.emoji} {i.name}
              {flagged && <span title="On your allergy list" aria-label="on your allergy list"> ⚠️</span>}
            </Chip>
          );
        })}
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">In my fridge ({fridge.length})</h2>
          {fridge.length > 0 && (
            <button type="button" onClick={clearFridge} className="text-sm font-bold text-beet underline">
              Clear
            </button>
          )}
        </div>
        {fridge.length === 0 ? (
          <p className="text-sm text-ink-soft">Tap ingredients above to add them.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fridge.map((id) => (
              <Chip key={id} active onClick={() => toggleFridge(id)}>
                {INGREDIENT_BY_ID[id]?.emoji} {INGREDIENT_BY_ID[id]?.name} ✕
              </Chip>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-ink-soft">
          Salt, oil, spices, sugar and ghee are assumed. Dairy-free? Swap ghee for oil.
        </p>
      </Card>

      <button
        type="button"
        disabled={fridge.length === 0}
        onClick={() => navigate("/results")}
        className={btn("primary", "w-full text-lg")}
      >
        Find recipes 🍛
      </button>
    </div>
  );
}
