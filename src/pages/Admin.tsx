import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { validateRecipe } from "../lib/libraryRecipes.ts";
import { AllergenChips, btn, Card, Notice, PageTitle } from "../components/ui.tsx";
import * as cloud from "../lib/cloud.ts";
import type { LibraryRow, OpenReport, RequestedDish } from "../lib/cloud.ts";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import type { CommunityPost } from "../types.ts";

/** Moderation queue. Only admins (see supabase/migrations/0001_init.sql) can read or change these rows. */
export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { refreshCommunity } = useApp();
  const [pending, setPending] = useState<CommunityPost[]>([]);
  const [reports, setReports] = useState<OpenReport[]>([]);
  const [drafts, setDrafts] = useState<LibraryRow[]>([]);
  const [asked, setAsked] = useState<RequestedDish[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, r, d, a] = await Promise.all([
        cloud.fetchPendingPosts(),
        cloud.fetchOpenReports(),
        cloud.fetchPendingLibrary(),
        cloud.fetchRequestedDishes(),
      ]);
      setPending(p);
      setReports(r);
      setDrafts(d);
      setAsked(a);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the queue.");
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (loading) return <p className="text-ink-soft">Loading…</p>;

  if (!isAdmin) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>🔒</p>
        <h1 className="text-xl font-semibold">Admins only</h1>
        <Link to="/" className={btn("secondary")}>Back to ingredients</Link>
      </Card>
    );
  }

  async function decide(post: CommunityPost, status: "approved" | "rejected") {
    let reason: string | undefined;
    if (status === "rejected") {
      const answer = window.prompt("Reason for rejecting (shown to the author):", "Please check the allergen info.");
      if (answer === null) return;
      reason = answer.trim() || undefined;
    }
    try {
      await cloud.moderatePost(post.id, status, reason);
      await Promise.all([load(), refreshCommunity()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the tip.");
    }
  }

  async function reviewDraft(row: LibraryRow, status: "approved" | "rejected") {
    let reason: string | undefined;
    if (status === "rejected") {
      const answer = window.prompt("Why reject this recipe? (for your own notes)", "Needs changes.");
      if (answer === null) return;
      reason = answer.trim() || undefined;
    }
    try {
      await cloud.reviewLibraryRecipe(row.id, status, reason);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the recipe.");
    }
  }

  async function dismiss(report: OpenReport, removeTip: boolean) {
    try {
      if (removeTip) await cloud.moderatePost(report.postId, "rejected", "Removed after a report.");
      await cloud.resolveReport(report.id);
      await Promise.all([load(), refreshCommunity()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the report.");
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Review" subtitle="Recipes and tips wait here until you approve them." />
      {error && <Notice tone="warn"><span role="alert">{error}</span></Notice>}

      <section className="space-y-3" aria-labelledby="library-heading">
        <h2 id="library-heading" className="text-xl font-semibold">Recipes to review ({drafts.length})</h2>
        <p className="text-sm text-ink-soft">
          Nothing here is shown to parents until you approve it. Allergens are worked out from our own ingredient list, not from the draft.
        </p>
        {drafts.length === 0 && <Card className="text-sm text-ink-soft">No drafts waiting.</Card>}
        {drafts.map((d) => {
          const recipe = validateRecipe(d.data);
          return (
            <Card key={d.id} className="space-y-2">
              <h3 className="font-semibold">{d.name}</h3>
              <p className="text-xs text-ink-soft">
                {d.requestedDish ? `Asked for: "${d.requestedDish}" · ` : ""}{d.source === "ai_draft" ? "AI draft" : "Written by hand"}
              </p>
              {recipe ? (
                <>
                  <p className="text-sm">{recipe.blurb} · {recipe.minutes} min · {recipe.diet}</p>
                  <AllergenChips allergens={[...new Set(recipe.ingredients.flatMap((i) => INGREDIENT_BY_ID[i.id].allergens))]} />
                  <p className="text-sm"><strong>Ingredients:</strong> {recipe.ingredients.map((i) => `${i.qty} ${INGREDIENT_BY_ID[i.id].name}`).join(", ")}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">{recipe.steps.map((st, n) => <li key={n}>{st}</li>)}</ol>
                  <p className="text-xs font-semibold text-ink-soft">Passes the automatic safety checks. Read the steps for toddler choking risks before approving.</p>
                </>
              ) : (
                <Notice tone="warn"><span role="alert">This draft fails the automatic checks (unknown ingredient, meat, health claim or malformed). It cannot be approved.</span></Notice>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" disabled={!recipe} onClick={() => reviewDraft(d, "approved")} className={btn("primary", "flex-1")}>
                  Approve
                </button>
                <button type="button" onClick={() => reviewDraft(d, "rejected")} className={btn("ghost")}>
                  Reject
                </button>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="space-y-2" aria-labelledby="asked-heading">
        <h2 id="asked-heading" className="text-xl font-semibold">Dishes parents ask for</h2>
        {asked.length === 0 && <Card className="text-sm text-ink-soft">No unmatched dishes yet.</Card>}
        {asked.length > 0 && (
          <Card className="text-sm">
            <ul className="space-y-1">
              {asked.map((a) => (
                <li key={a.dish} className="flex justify-between"><span>{a.dish}</span><span className="text-ink-soft">{a.asked}×</span></li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-xl font-semibold">Pending tips ({pending.length})</h2>
        {pending.length === 0 && <Card className="text-sm text-ink-soft">Nothing waiting. 🎉</Card>}
        {pending.map((p) => (
          <Card key={p.id} className="space-y-2">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-xs text-ink-soft">
              {RECIPE_BY_ID[p.recipeId]?.name ?? p.recipeId} · by {p.authorName} · ages {p.ageBand}
            </p>
            <p className="text-sm">
              <strong>{p.whatAdded}</strong>: {p.amount}. {p.whereInRecipe}
            </p>
            {p.tasteNote && <p className="text-sm italic text-ink-soft">"{p.tasteNote}"</p>}
            {p.allergenTags.length > 0 ? (
              <AllergenChips allergens={p.allergenTags} />
            ) : (
              <p className="text-xs font-semibold text-ink-soft">Author says: no common allergens</p>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => decide(p, "approved")} className={btn("primary", "flex-1")}>
                Approve
              </button>
              <button type="button" onClick={() => decide(p, "rejected")} className={btn("ghost")}>
                Reject
              </button>
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-3" aria-labelledby="reports-heading">
        <h2 id="reports-heading" className="text-xl font-semibold">Open reports ({reports.length})</h2>
        {reports.length === 0 && <Card className="text-sm text-ink-soft">No open reports.</Card>}
        {reports.map((r) => (
          <Card key={r.id} className="space-y-2">
            <h3 className="font-semibold">{r.postTitle}</h3>
            <p className="text-sm">Reason: {r.reason}{r.note ? `. "${r.note}"` : ""}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => dismiss(r, true)} className={btn("danger", "flex-1")}>
                Remove tip
              </button>
              <button type="button" onClick={() => dismiss(r, false)} className={btn("ghost")}>
                Dismiss
              </button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
