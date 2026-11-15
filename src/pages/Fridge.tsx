import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { INGREDIENTS, INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { RECIPES } from "../data/recipes.ts";
import { byTaste, lastReactions } from "../lib/taste.ts";
import Glyph from "../components/Glyph.tsx";
import KidSwitcher from "../components/KidSwitcher.tsx";
import MicButton from "../components/MicButton.tsx";
import { parseIngredients } from "../lib/voice.ts";
import PhotoScan from "../components/PhotoScan.tsx";
import { btn, Chip } from "../components/ui.tsx";
import { checkRecipe, combinedAllergies, dietAllows, otherAllergyHit } from "../lib/safety.ts";
import { useApp } from "../state/AppState.tsx";

export default function Fridge() {
  const { fridge, toggleFridge, clearFridge, activeKids, quickPicks, history } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [heard, setHeard] = useState<string | null>(null);

  function onSpoken(text: string) {
    const ids = parseIngredients(text);
    ids.filter((id) => !fridge.includes(id)).forEach(toggleFridge);
    setHeard(
      ids.length > 0
        ? `Added: ${ids.map((id) => INGREDIENT_BY_ID[id]?.name.replace(/\s*\(.*\)/, "")).join(", ")}`
        : `Heard "${text}", but no ingredients matched. Try "potato, paneer, spinach".`,
    );
  }

  const allergies = combinedAllergies(activeKids);
  const q = query.trim().toLowerCase();
  const hits = q
    ? INGREDIENTS.filter((i) => i.category !== "pantry" && i.name.toLowerCase().includes(q))
    : null;

  // Nothing picked yet: offer a few quick, safe dinners, so tonight needs one tap. Refused dishes are left out.
  const last = lastReactions(history);
  const tonight = byTaste(
    RECIPES.filter(
      (r) => r.minutes <= 20 && last[r.id] !== "not_this_time" && dietAllows(r, activeKids) && checkRecipe(r, activeKids).status !== "blocked",
    ),
    (r) => r.id,
    last,
  ).slice(0, 3);

  function ingredientChip(id: string) {
    const i = INGREDIENT_BY_ID[id];
    if (!i) return null;
    const flagged = i.allergens.some((a) => allergies.includes(a)) || otherAllergyHit(i.name, activeKids) !== null;
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
        <MicButton label="Say what you have" onText={onSpoken} onProblem={setHeard} />
        <PhotoScan />
      </div>

      {heard && <p role="status" className="text-sm font-bold text-spinach">{heard}</p>}

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

      {fridge.length === 0 && tonight.length > 0 && (
        <section className="space-y-2" aria-label="Quick tonight">
          <h2 className="text-lg font-extrabold">Quick tonight</h2>
          {tonight.map((r) => (
            <Link key={r.id} to={`/recipe/${r.id}`} className="flex min-h-12 items-center gap-3 rounded-2xl bg-white px-4 py-2 ring-1 ring-black/10">
              <span className="text-2xl" aria-hidden>{r.emoji}</span>
              <span className="flex-1 font-bold">{r.name}</span>
              <span className="text-sm text-ink-soft">{r.minutes} min</span>
            </Link>
          ))}
        </section>
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
