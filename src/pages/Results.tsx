import { Link } from "react-router-dom";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { AllergenChips, btn, Card, PageTitle } from "../components/ui.tsx";
import { visibleBoosts } from "../lib/boosts.ts";
import { matchRecipes } from "../lib/match.ts";
import type { MatchResult } from "../lib/match.ts";
import { recipeAllergens } from "../lib/safety.ts";
import { useApp } from "../state/AppState.tsx";

function RecipeCard({ result }: { result: MatchResult }) {
  const { activeKids } = useApp();
  const { recipe, have, missing, ratio, safety } = result;
  const boostCount = visibleBoosts(recipe, activeKids).allowed.length;
  const total = have.length + missing.length;

  return (
    <Link to={`/recipe/${recipe.id}`} className="block">
      <Card className="transition hover:shadow-md active:scale-[0.99]">
        <div className="flex gap-3">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-turmeric-soft text-3xl" aria-hidden>
            {recipe.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-extrabold leading-tight">{recipe.name}</h3>
            <p className="text-sm text-ink-soft">{recipe.blurb}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs font-bold">
            <span>
              You have {have.length} of {total}
            </span>
            <span className="text-ink-soft">{recipe.minutes} min</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Ingredients you have">
            <div className="h-full rounded-full bg-spinach" style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>

        {missing.length > 0 && (
          <p className="mt-2 text-sm">
            <span className="font-bold">Missing: </span>
            {missing.map((id) => INGREDIENT_BY_ID[id]?.name).join(", ")}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {boostCount > 0 && (
            <span className="rounded-full bg-spinach-soft px-2.5 py-1 text-xs font-extrabold text-spinach">
              ✨ {boostCount} boosts available
            </span>
          )}
          {safety.status === "swap" && (
            <span className="rounded-full bg-turmeric-soft px-2.5 py-1 text-xs font-extrabold">
              Safe with a swap
            </span>
          )}
        </div>
        <div className="mt-2">
          <AllergenChips allergens={recipeAllergens(recipe)} />
        </div>
      </Card>
    </Link>
  );
}

export default function Results() {
  const { fridge, activeKids } = useApp();
  const results = matchRecipes(fridge, activeKids);
  const ready = results.filter((r) => r.kind === "ready");
  const almost = results.filter((r) => r.kind === "almost");

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
    </div>
  );
}
