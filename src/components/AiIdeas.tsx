import { useEffect, useState } from "react";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { Card, Notice } from "./ui.tsx";
import { fetchIdeas } from "../lib/cloud.ts";
import type { AiIdea } from "../lib/aiIdeas.ts";
import { cloudEnabled } from "../lib/supabase.ts";
import { useAuth } from "../state/AuthState.tsx";
import { useApp } from "../state/AppState.tsx";

/** "More from your fridge": AI-written ideas, re-checked against the allergy list before they are shown. */
export default function AiIdeas() {
  const { fridge, activeKids } = useApp();
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ideas, setIdeas] = useState<AiIdea[]>([]);

  const key = fridge.join(",") + "|" + activeKids.map((k) => k.allergies.join("+")).join(";");

  useEffect(() => {
    if (!cloudEnabled || !user || fridge.length === 0) return;
    let cancelled = false;
    setState("loading");
    fetchIdeas(fridge, activeKids)
      .then((r) => {
        if (cancelled) return;
        setIdeas(r);
        setState("done");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user?.id]);

  if (!cloudEnabled) return null;

  return (
    <section className="space-y-3" aria-labelledby="ai-heading">
      <h2 id="ai-heading" className="text-xl font-extrabold">✨ More from your fridge</h2>
      {!user && <p className="text-sm text-ink-soft">Sign in to get fresh recipe ideas made from just your ingredients.</p>}
      {user && state === "loading" && <Card><p className="text-sm text-ink-soft">Creating recipes from your ingredients…</p></Card>}
      {user && state === "error" && <p className="text-sm text-ink-soft">Couldn't create ideas right now. The recipes above still work.</p>}
      {user && state === "done" && ideas.length === 0 && (
        <p className="text-sm text-ink-soft">No extra ideas this time. Try adding a few more ingredients.</p>
      )}
      {ideas.length > 0 && (
        <>
          <Notice tone="warn">
            Made just now using only your ingredients and checked against your allergy list. These are AI ideas, not
            reviewed by a dietitian. Please double-check labels.
          </Notice>
          {ideas.map((idea) => (
            <Card key={idea.name}>
              <h3 className="text-lg font-extrabold">{idea.name}</h3>
              <p className="text-sm text-ink-soft">{idea.blurb}</p>
              <p className="mt-1 text-sm font-bold">{idea.minutes} minutes</p>
              <details className="mt-2">
                <summary className="cursor-pointer font-bold">See recipe</summary>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {idea.ingredients.map((i) => (
                    <li key={i.id}>{INGREDIENT_BY_ID[i.id]?.name}, {i.qty}</li>
                  ))}
                </ul>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  {idea.steps.map((s, n) => <li key={n}>{s}</li>)}
                </ol>
              </details>
            </Card>
          ))}
        </>
      )}
    </section>
  );
}
