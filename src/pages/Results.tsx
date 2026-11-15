import { useState } from "react";
import { Link } from "react-router-dom";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import AiIdeas from "../components/AiIdeas.tsx";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { btn, Card, PageTitle } from "../components/ui.tsx";
import { visibleBoosts } from "../lib/boosts.ts";
import { matchRecipes, pageResults } from "../lib/match.ts";
import type { MatchResult } from "../lib/match.ts";
import { useApp } from "../state/AppState.tsx";

function RecipeCard({ result }: { result: MatchResult }) {
  const { activeKids } = useApp();
  const { recipe, missing, safety } = result;
  const boostCount = visibleBoosts(recipe, activeKids).allowed.length;
  const note =
    missing.length > 0
      ? `Missing ${missing.map((id) => INGREDIENT_BY_ID[id]?.name).join(", ")}`
      : safety.status === "swap"
        ? "Ready · safe with a swap"
        : "Ready to cook";

  return (
    <Link to={`/recipe/${recipe.id}`} className="block">
      <Card className="transition hover:shadow-md active:scale-[0.99]">
        <div className="flex gap-3">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-turmeric-soft text-3xl" aria-hidden>
            {recipe.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold leading-tight">{recipe.name}</h3>
            <p className={missing.length > 0 ? "text-sm text-ink-soft" : "text-sm font-bold text-spinach"}>{note}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {recipe.minutes} min{boostCount > 0 ? ` · ✨ ${boostCount} boosts` : ""}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Results() {
  const { fridge, activeKids } = useApp();
  const results = matchRecipes(fridge, activeKids);
  const [pages, setPages] = useState(1);
  const { ready, almost, hasMore } = pageResults(results, pages);

  return (
    <div className="space-y-5">
      <PageTitle title="Recipes for you" subtitle={`Based on ${fridge.length} ingredient${fridge.length === 1 ? "" : "s"}.`} />
      <KidSwitcher />

      {results.length === 0 && (
        <Card className="text-center">
          <p className="text-4xl" aria-hidden>🤔</p>
          <p className="mt-2 font-bold">No safe matches yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try adding a staple like atta, dal or paneer, or check your kid's allergies and diet in Profile.
          </p>
          <Link to="/" className={btn("secondary", "mt-4")}>
            Back to my fridge
          </Link>
        </Card>
      )}

      {ready.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Ready to cook</h2>
          {ready.map((r) => (
            <RecipeCard key={r.recipe.id} result={r} />
          ))}
        </section>
      )}

      {almost.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">Almost there</h2>
          {almost.map((r) => (
            <RecipeCard key={r.recipe.id} result={r} />
          ))}
        </section>
      )}

      {hasMore && (
        <button type="button" onClick={() => setPages((n) => n + 1)} className={btn("secondary", "w-full")}>
          See more
        </button>
      )}

      <AiIdeas />
    </div>
  );
}
