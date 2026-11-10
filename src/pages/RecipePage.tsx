import { useState } from "react";
import { Link } from "react-router-dom";
import { BOOST_BY_ID } from "../data/boosts.ts";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import {
  AllergenChips,
  btn,
  Card,
  cx,
  Notice,
  NutrientBadges,
} from "../components/ui.tsx";
import { badgeSummary, boostTextsForStep, displayIngredients } from "../lib/boosts.ts";
import { combinedAllergies, recipeAllergens, usesGhee } from "../lib/safety.ts";
import { useRecipeSession } from "../lib/useRecipeSession.ts";
import { useApp } from "../state/AppState.tsx";
import type { Boost, CommunityPost } from "../types.ts";

function BoostToggle({
  boost,
  on,
  picky,
  onToggle,
}: {
  boost: Boost;
  on: boolean;
  picky: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cx(
        "w-full rounded-3xl p-4 text-left ring-2 transition active:scale-[0.99]",
        on ? "bg-spinach-soft ring-spinach" : "bg-white ring-black/10",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>{boost.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold">{boost.name}</h3>
            <span
              className={cx(
                "shrink-0 rounded-full px-3 py-1 text-xs font-extrabold",
                on ? "bg-spinach text-white" : "bg-black/5 text-ink-soft",
              )}
            >
              {on ? "On" : "Off"}
            </span>
          </div>
          <p className="text-sm">
            Add <strong>{boost.add}</strong>: {boost.amount}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{boost.why}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <NutrientBadges badges={boost.badges} />
            {picky && boost.blendsIn && (
              <span className="rounded-full bg-turmeric-soft px-2.5 py-1 text-xs font-extrabold">
                Blends in easily
              </span>
            )}
          </div>
          {boost.allergens.length > 0 && (
            <div className="mt-2">
              <AllergenChips allergens={boost.allergens} />
            </div>
          )}
          <p className="mt-2 text-xs text-ink-soft">{boost.note}</p>
        </div>
      </div>
    </button>
  );
}

function PostToggle({ post, on, onToggle }: { post: CommunityPost; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      className={cx(
        "w-full rounded-3xl p-4 text-left ring-2 transition active:scale-[0.99]",
        on ? "bg-spinach-soft ring-spinach" : "bg-white ring-black/10",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-extrabold">{post.title}</h3>
        <span className={cx("shrink-0 rounded-full px-3 py-1 text-xs font-extrabold", on ? "bg-spinach text-white" : "bg-black/5 text-ink-soft")}>
          {on ? "On" : "Off"}
        </span>
      </div>
      <p className="text-sm">
        Add <strong>{post.whatAdded}</strong>: {post.amount}
      </p>
      <p className="text-sm text-ink-soft">{post.whereInRecipe}</p>
      <p className="mt-1 text-xs text-ink-soft">
        Parent tip from {post.authorName}. Not reviewed by a dietitian.
      </p>
      {post.allergenTags.length > 0 && (
        <div className="mt-2">
          <AllergenChips allergens={post.allergenTags} />
        </div>
      )}
    </button>
  );
}

export default function RecipePage() {
  const session = useRecipeSession();
  const { activeKids, saveRecipe } = useApp();
  const [justSaved, setJustSaved] = useState(false);

  if (!session) {
    return (
      <Card className="text-center">
        <p className="font-bold">We couldn't find that recipe.</p>
        <Link to="/" className={btn("secondary", "mt-4")}>Back to my fridge</Link>
      </Card>
    );
  }

  const { recipe, safety, fits, options, allowedPosts, hiddenPostCount, boostIds, postIds, selectedPosts, query } =
    session;

  if (!fits) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>🚫</p>
        <h1 className="text-xl font-extrabold">{recipe.name} isn't a fit right now</h1>
        <p className="text-sm text-ink-soft">
          {safety.reason ?? "It doesn't match the selected diet."} Change who you're cooking for, or pick another
          recipe.
        </p>
        <Link to="/results" className={btn("secondary")}>Back to recipes</Link>
      </Card>
    );
  }

  const picky = activeKids.some((k) => k.picky);
  const allergies = combinedAllergies(activeKids);
  const lines = displayIngredients(recipe, safety.swaps);
  const badges = badgeSummary(recipe, boostIds);
  const selectedBoosts = boostIds.map((id) => BOOST_BY_ID[id]);
  const swappedNames = safety.swaps.map((s) => INGREDIENT_BY_ID[s.with]?.name ?? s.with);

  function save() {
    saveRecipe(recipe.id, boostIds, postIds);
    setJustSaved(true);
  }

  return (
    <div className="space-y-5">
      <Link to="/results" className="text-sm font-bold text-beet">← Recipes</Link>

      <header>
        <p className="text-5xl" aria-hidden>{recipe.emoji}</p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight">{recipe.name}</h1>
        <p className="text-ink-soft">{recipe.blurb}</p>
        <p className="mt-1 text-sm font-bold">{recipe.minutes} minutes</p>
        <div className="mt-2">
          <AllergenChips allergens={recipeAllergens(recipe)} />
        </div>
      </header>

      {safety.swaps.length > 0 && (
        <Notice tone="warn">
          <strong>Allergen swap applied.</strong>
          <ul className="mt-1 list-disc pl-5">
            {safety.swaps.map((s) => (
              <li key={s.allergen}>{s.note}</li>
            ))}
          </ul>
        </Notice>
      )}
      {allergies.includes("dairy") && usesGhee(recipe) && (
        <Notice tone="warn">
          <strong>No ghee:</strong> use oil wherever this recipe calls for ghee.
        </Notice>
      )}

      <section aria-labelledby="boost-heading" className="space-y-3">
        <h2 id="boost-heading" className="text-2xl font-extrabold">Make it stronger ✨</h2>
        {options.allowed.length === 0 && (
          <p className="text-sm text-ink-soft">No boosts are suggested for this recipe and these kids.</p>
        )}
        {options.allowed.map((b) => (
          <BoostToggle
            key={b.id}
            boost={b}
            on={boostIds.includes(b.id)}
            picky={picky}
            onToggle={() => session.toggleBoostId(b.id)}
          />
        ))}

        {allowedPosts.length > 0 && (
          <>
            <h3 className="pt-2 text-lg font-extrabold">Community boosts</h3>
            {allowedPosts.map((p) => (
              <PostToggle key={p.id} post={p} on={postIds.includes(p.id)} onToggle={() => session.togglePostId(p.id)} />
            ))}
          </>
        )}

        {(options.hidden.length > 0 || hiddenPostCount > 0) && (
          <details className="rounded-2xl bg-white p-3 text-sm ring-1 ring-black/10">
            <summary className="cursor-pointer font-bold">Why are some boosts hidden?</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {options.hidden.map(({ boost, reason }) => (
                <li key={boost.id}>
                  <strong>{boost.name}:</strong> {reason}
                </li>
              ))}
              {hiddenPostCount > 0 && (
                <li>
                  {hiddenPostCount} community tip{hiddenPostCount === 1 ? "" : "s"} hidden for allergen or age reasons.
                </li>
              )}
            </ul>
          </details>
        )}
      </section>

      <Card>
        <h2 className="mb-2 text-lg font-extrabold">Nutrition, before and after</h2>
        <p className="mb-1 text-xs font-bold text-ink-soft">Before</p>
        {badges.before.length > 0 ? (
          <NutrientBadges badges={badges.before} />
        ) : (
          <p className="text-sm text-ink-soft">Mostly energy. Boosts add the extras.</p>
        )}
        <p className="mb-1 mt-3 text-xs font-bold text-ink-soft">After your boosts</p>
        {badges.after.length > 0 ? (
          <NutrientBadges badges={badges.after} highlight={badges.added} />
        ) : (
          <p className="text-sm text-ink-soft">Switch on a boost above to see it change.</p>
        )}
        <p className="mt-3 text-xs text-ink-soft">Estimates only. Not medical advice.</p>
      </Card>

      <section aria-labelledby="ing-heading">
        <h2 id="ing-heading" className="mb-2 text-2xl font-extrabold">Ingredients</h2>
        <ul className="space-y-1.5">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-2">
              <span aria-hidden>{l.emoji}</span>
              <span>
                <strong>{l.name}</strong>, {l.qty}
                {l.optional && <span className="text-ink-soft"> (optional)</span>}
              </span>
            </li>
          ))}
          {selectedBoosts.map((b) => (
            <li key={b.id} className="flex gap-2 font-bold text-spinach">
              <span aria-hidden>✨</span>
              <span>
                {b.add}: {b.amount}
              </span>
            </li>
          ))}
          {selectedPosts.map((p) => (
            <li key={p.id} className="flex gap-2 font-bold text-spinach">
              <span aria-hidden>💬</span>
              <span>
                {p.whatAdded}: {p.amount} (parent tip)
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="mb-2 text-2xl font-extrabold">Steps</h2>
        <ol className="space-y-3">
          {recipe.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-turmeric font-extrabold">
                {i + 1}
              </span>
              <div>
                <p>{s}</p>
                {boostTextsForStep(recipe, i, boostIds).map((b) => (
                  <p key={b.id} className="mt-1 rounded-xl bg-spinach-soft px-3 py-1.5 text-sm font-bold">
                    ✨ {b.stepText}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {swappedNames.length > 0 && (
          <p className="mt-3 text-xs text-ink-soft">
            Steps mention the original ingredient. Use {swappedNames.join(" and ")} instead, as noted above.
          </p>
        )}
      </section>

      <div className="sticky bottom-20 z-[5] flex gap-2 rounded-full bg-cream/90 p-2 backdrop-blur">
        <Link to={`/cook/${recipe.id}${query}`} className={btn("primary", "flex-1")}>
          Start cooking 👩‍🍳
        </Link>
        <button type="button" onClick={save} disabled={justSaved} className={btn("secondary")}>
          {justSaved ? "Saved ✓" : "Save ❤️"}
        </button>
      </div>
    </div>
  );
}
