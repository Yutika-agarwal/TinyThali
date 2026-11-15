import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { INGREDIENTS, INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { WEEKLY } from "../data/weekly.ts";
import Glyph from "../components/Glyph.tsx";
import KidSwitcher from "../components/KidSwitcher.tsx";
import PhotoScan from "../components/PhotoScan.tsx";
import { btn, Chip } from "../components/ui.tsx";
import { checkRecipe, combinedAllergies, dietAllows } from "../lib/safety.ts";
import { useApp } from "../state/AppState.tsx";

export default function Fridge() {
  const { fridge, toggleFridge, clearFridge, activeKids, quickPicks } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const allergies = combinedAllergies(activeKids);
  const q = query.trim().toLowerCase();
  const hits = q
    ? INGREDIENTS.filter((i) => i.category !== "pantry" && i.name.toLowerCase().includes(q))
    : null;
  const weekly = WEEKLY.recipeIds
    .map((id) => RECIPE_BY_ID[id])
    .filter((r) => r && checkRecipe(r, activeKids).status !== "blocked" && dietAllows(r, activeKids));

  function ingredientChip(id: string) {
    const i = INGREDIENT_BY_ID[id];
    if (!i) return null;
    const flagged = i.allergens.some((a) => allergies.includes(a));
    return (
      <Chip key={id} active={fridge.includes(id)} onClick={() => toggleFridge(id)}>
        <Glyph kind="ing" id={id} emoji={i.emoji} /> {i.name}
        {flagged && <span aria-label="on your allergy list"> ⚠️</span>}
      </Chip>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold leading-tight">What do you have?</h1>

      <KidSwitcher />

      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ingredients"
          aria-label="Search ingredients"
          className="min-h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 ring-1 ring-black/10"
        />
        <PhotoScan />
      </div>

      {hits ? (
        <div className="flex flex-wrap gap-2">
          {hits.length === 0 && <p className="text-sm text-ink-soft">Nothing matches "{query}".</p>}
          {hits.map((i) => ingredientChip(i.id))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[...quickPicks, ...fridge.filter((id) => !quickPicks.includes(id))].map(ingredientChip)}
          </div>
        </>
      )}

      {weekly.length > 0 && (
        <details className="rounded-2xl bg-white p-3 ring-1 ring-black/10">
          <summary className="cursor-pointer font-extrabold">This week's kid picks</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {weekly.map((r) => (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="min-h-11 rounded-full bg-white px-4 py-2.5 text-sm font-bold ring-1 ring-black/10"
              >
                {r.emoji} {r.name}
              </Link>
            ))}
          </div>
        </details>
      )}

      <div className="sticky bottom-20 z-[5] flex items-center gap-3 rounded-full bg-cream/90 p-2 backdrop-blur">
        <button
          type="button"
          disabled={fridge.length === 0}
          onClick={() => navigate("/results")}
          className={btn("primary", "flex-1 text-lg")}
        >
          {fridge.length ? `Find recipes · ${fridge.length}` : "Pick what you have"}
        </button>
        {fridge.length > 0 && (
          <button type="button" onClick={clearFridge} className="min-h-11 px-2 text-sm font-extrabold text-beet">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
