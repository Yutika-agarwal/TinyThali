import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { btn, Card, cx, Notice } from "../components/ui.tsx";
import { boostTextsForStep, postsForStep } from "../lib/boosts.ts";
import { combinedAllergies, usesGhee } from "../lib/safety.ts";
import { useRecipeSession } from "../lib/useRecipeSession.ts";
import { useApp } from "../state/AppState.tsx";
import type { Reaction } from "../types.ts";

const REACTIONS: { id: Reaction; emoji: string; label: string }[] = [
  { id: "loved", emoji: "😍", label: "Loved it" },
  { id: "ate_some", emoji: "🙂", label: "Ate some" },
  { id: "not_this_time", emoji: "😅", label: "Not this time" },
];

export default function Cook() {
  const session = useRecipeSession();
  const { activeKids, addHistory, saveRecipe } = useApp();
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [saved, setSaved] = useState(false);

  // Keep the screen awake while cooking, so there is no tapping with floury hands.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    return () => {
      lock?.release().catch(() => undefined);
    };
  }, []);

  if (!session || !session.fits) {
    return (
      <div className="mx-auto min-h-dvh max-w-md p-4">
        <Card className="space-y-3 text-center">
          <p className="font-bold">This recipe isn't available for the selected kids.</p>
          <Link to="/" className={btn("secondary")}>Back to my fridge</Link>
        </Card>
      </div>
    );
  }

  const { recipe, safety, boostIds, postIds, selectedPosts, query } = session;
  const last = recipe.steps.length - 1;
  const noGhee = combinedAllergies(activeKids).includes("dairy") && usesGhee(recipe);

  function choose(r: Reaction) {
    if (reaction) return;
    setReaction(r);
    addHistory({ recipeId: recipe.id, boostIds, postIds, reaction: r });
  }

  if (finished) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-4 pt-10 text-center">
        <p className="text-6xl" aria-hidden>🎉</p>
        <h1 className="text-3xl font-extrabold">All done!</h1>
        <p className="text-ink-soft">Did your kid eat it? This helps you remember what works.</p>

        <div className="grid grid-cols-3 gap-2">
          {REACTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => choose(r.id)}
              disabled={reaction !== null}
              aria-pressed={reaction === r.id}
              className={cx(
                "min-h-24 rounded-3xl p-2 text-sm font-extrabold ring-2 transition",
                reaction === r.id ? "bg-spinach-soft ring-spinach" : "bg-white ring-black/10",
                reaction !== null && reaction !== r.id && "opacity-50",
              )}
            >
              <span className="block text-3xl" aria-hidden>{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>

        {reaction && (
          <Notice tone="good">
            {reaction === "not_this_time"
              ? "Totally normal. Try a boost that blends in next time, or serve a small portion alongside a favorite."
              : "Logged in your history."}
          </Notice>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={btn("secondary")}
            disabled={saved}
            onClick={() => {
              saveRecipe(recipe.id, boostIds, postIds);
              setSaved(true);
            }}
          >
            {saved ? "Saved ✓" : "Save to my recipes ❤️"}
          </button>
          <Link to="/saved" className={btn("ghost")}>See saved and history</Link>
          <Link to="/" className={btn("primary")}>Back to my fridge</Link>
        </div>
      </div>
    );
  }

  const boostsHere = boostTextsForStep(recipe, step, boostIds);
  const tipsHere = postsForStep(recipe, step, selectedPosts);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col p-4">
      <div className="flex items-center justify-between">
        <Link to={`/recipe/${recipe.id}${query}`} className="text-sm font-bold text-beet">✕ Exit</Link>
        <p className="text-sm font-extrabold">
          Step {step + 1} of {recipe.steps.length}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={recipe.steps.length} aria-label="Cooking progress">
        <div className="h-full rounded-full bg-spinach transition-all" style={{ width: `${((step + 1) / recipe.steps.length) * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 py-6">
        <p className="text-5xl" aria-hidden>{recipe.emoji}</p>
        <p className="text-2xl font-extrabold leading-snug">{recipe.steps[step]}</p>

        {boostsHere.map((b) => (
          <div key={b.id} className="rounded-2xl bg-spinach-soft p-4 text-lg font-bold ring-2 ring-spinach">
            ✨ Boost: {b.stepText}
          </div>
        ))}
        {tipsHere.map((p) => (
          <div key={p.id} className="rounded-2xl bg-spinach-soft p-4 font-bold ring-2 ring-spinach">
            💬 Parent tip: add {p.whatAdded} ({p.amount}). {p.whereInRecipe}.
          </div>
        ))}

        {safety.swaps.map((s) => (
          <p key={s.allergen} className="rounded-2xl bg-beet-soft p-3 text-sm font-bold">
            Swap: {s.note}
          </p>
        ))}
        {noGhee && step === 0 && (
          <p className="rounded-2xl bg-beet-soft p-3 text-sm font-bold">No ghee: use oil instead.</p>
        )}
      </div>

      <div className="flex gap-2 pb-[env(safe-area-inset-bottom)]">
        <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className={btn("secondary", "flex-1")}>
          ← Back
        </button>
        {step < last ? (
          <button type="button" onClick={() => setStep(step + 1)} className={btn("primary", "flex-[2] text-lg")}>
            Next →
          </button>
        ) : (
          <button type="button" onClick={() => setFinished(true)} className={btn("primary", "flex-[2] text-lg")}>
            Finish ✓
          </button>
        )}
      </div>
    </div>
  );
}
