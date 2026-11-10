import { useState } from "react";
import { Link } from "react-router-dom";
import { BOOST_BY_ID } from "../data/boosts.ts";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { btn, Card, Chip, Notice, PageTitle } from "../components/ui.tsx";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import type { Reaction } from "../types.ts";

const REACTION_EMOJI: Record<Reaction, string> = { loved: "😍", ate_some: "🙂", not_this_time: "😅" };
const REACTION_LABEL: Record<Reaction, string> = { loved: "Loved it", ate_some: "Ate some", not_this_time: "Not this time" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function boostNames(ids: string[]): string {
  const names = ids.map((id) => BOOST_BY_ID[id]?.name).filter(Boolean);
  return names.length > 0 ? names.join(", ") : "No boosts";
}

function cookAgainLink(recipeId: string, boostIds: string[], postIds: string[]): string {
  const q = new URLSearchParams();
  if (boostIds.length) q.set("b", boostIds.join(","));
  if (postIds.length) q.set("p", postIds.join(","));
  const s = q.toString();
  return `/recipe/${recipeId}${s ? `?${s}` : ""}`;
}

export default function Saved() {
  const { saved, removeSaved, history } = useApp();
  const { enabled, user } = useAuth();
  const [tab, setTab] = useState<"saved" | "history">("saved");

  return (
    <div className="space-y-5">
      <PageTitle title="Your recipes" subtitle="Saved with the boosts you used." />

      <div className="flex gap-2">
        <Chip active={tab === "saved"} onClick={() => setTab("saved")}>Saved ({saved.length})</Chip>
        <Chip active={tab === "history"} onClick={() => setTab("history")}>History ({history.length})</Chip>
      </div>

      {tab === "saved" && (
        <div className="space-y-3">
          {saved.length === 0 && (
            <Card className="text-center">
              <p className="text-4xl" aria-hidden>❤️</p>
              <p className="mt-2 font-bold">Nothing saved yet.</p>
              <p className="text-sm text-ink-soft">Save a recipe to keep it with the boosts you chose.</p>
              <Link to="/" className={btn("secondary", "mt-4")}>Find a recipe</Link>
            </Card>
          )}
          {saved.map((s) => {
            const recipe = RECIPE_BY_ID[s.recipeId];
            if (!recipe) return null;
            return (
              <Card key={s.id}>
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>{recipe.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-extrabold">{recipe.name}</h2>
                    <p className="text-sm text-ink-soft">{boostNames(s.boostIds)}</p>
                    <p className="text-xs text-ink-soft">Saved {formatDate(s.savedAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={cookAgainLink(s.recipeId, s.boostIds, s.postIds)} className={btn("primary", "flex-1")}>
                    Cook again
                  </Link>
                  <button type="button" onClick={() => removeSaved(s.id)} className={btn("ghost")} aria-label={`Remove ${recipe.name}`}>
                    Remove
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 && (
            <Card className="text-center">
              <p className="font-bold">No cooking history yet.</p>
              <p className="text-sm text-ink-soft">Finish a recipe in cook mode and tell us how it went.</p>
            </Card>
          )}
          {history.map((h) => {
            const recipe = RECIPE_BY_ID[h.recipeId];
            if (!recipe) return null;
            return (
              <Card key={h.id}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>{REACTION_EMOJI[h.reaction]}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-extrabold">{recipe.name}</h2>
                    <p className="text-sm text-ink-soft">
                      {REACTION_LABEL[h.reaction]} · {formatDate(h.cookedAt)}
                    </p>
                    <p className="text-sm text-ink-soft">{boostNames(h.boostIds)}</p>
                  </div>
                  <Link to={cookAgainLink(h.recipeId, h.boostIds, h.postIds)} className="text-sm font-extrabold text-beet">
                    Again
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!enabled && <Notice>Saved recipes and history are stored on this device only.</Notice>}
      {enabled && user && <Notice tone="good">Synced to your account, so they follow you to any device.</Notice>}
      {enabled && !user && (
        <Notice>
          Stored on this device only.{" "}
          <Link to="/login" className="font-extrabold text-beet underline">Sign in</Link> to keep them on every device.
        </Notice>
      )}
    </div>
  );
}
