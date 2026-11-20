import { useState } from "react";
import { Link } from "react-router-dom";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { FEATURES } from "../config/features.ts";
import AiIdeas from "../components/AiIdeas.tsx";
import SaveHeart from "../components/SaveHeart.tsx";
import { btn, Card, Chip, PageTitle } from "../components/ui.tsx";
import { visibleBoosts } from "../lib/boosts.ts";
import { matchRecipes, pageResults } from "../lib/match.ts";
import type { MatchResult } from "../lib/match.ts";
import { byTaste, lastReactions } from "../lib/taste.ts";
import { useApp } from "../state/AppState.tsx";

function RecipeCard({ result }: { result: MatchResult }) {
  const { activeKids, history } = useApp();
  const { recipe, missing, safety } = result;
  const reaction = lastReactions(history)[recipe.id];
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
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-black/5 text-3xl" aria-hidden>
            {recipe.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold leading-tight">{recipe.name}</h3>
            <p className={missing.length > 0 ? "text-sm text-ink-soft" : "text-sm font-semibold text-spinach"}>{note}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {recipe.minutes} min{boostCount > 0 ? ` · ✨ ${boostCount} boosts` : ""}
              {reaction === "loved" && " · 😍 Loved"}
              {reaction === "not_this_time" && " · Not a hit last time"}
            </p>
          </div>
          <SaveHeart recipeId={recipe.id} />
        </div>
      </Card>
    </Link>
  );
}

export default function Results() {
  const { fridge, activeKids, history } = useApp();
  const last = lastReactions(history);
  const [quick, setQuick] = useState(false);
  const matched = matchRecipes(fridge, activeKids).filter((r) => !quick || r.recipe.minutes <= 20);
  // Keep ready-before-almost, but let loved dishes lead and refused ones trail inside each group.
  const results = [
    ...byTaste(matched.filter((r) => r.kind === "ready"), (r) => r.recipe.id, last),
    ...byTaste(matched.filter((r) => r.kind === "almost"), (r) => r.recipe.id, last),
  ];
  const [pages, setPages] = useState(1);
  const { ready, almost, hasMore } = pageResults(results, pages);

  return (
    <div className="space-y-5">
      <PageTitle title="Recipes for you" />
      <div>
        <Chip active={quick} onClick={() => setQuick((q) => !q)}>⏱ 20 min or less</Chip>
      </div>

      {results.length === 0 && (
        <Card className="text-center">
          <p className="text-4xl" aria-hidden>🤔</p>
          <p className="mt-2 font-semibold">No safe matches yet.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Try adding a staple like atta, dal or paneer, or check your kid's allergies and diet in Profile.
          </p>
          <Link to="/" className={btn("secondary", "mt-4")}>
            Back to ingredients
          </Link>
        </Card>
      )}

      {ready.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ready to cook</h2>
          {ready.map((r) => (
            <RecipeCard key={r.recipe.id} result={r} />
          ))}
        </section>
      )}

      {almost.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Almost there</h2>
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

      {FEATURES.ai && <AiIdeas />}
    </div>
  );
}
