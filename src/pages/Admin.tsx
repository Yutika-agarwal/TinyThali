import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { AllergenChips, btn, Card, Notice, PageTitle } from "../components/ui.tsx";
import * as cloud from "../lib/cloud.ts";
import type { OpenReport } from "../lib/cloud.ts";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import type { CommunityPost } from "../types.ts";

/** Moderation queue. Only admins (see supabase/migrations/0001_init.sql) can read or change these rows. */
export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { refreshCommunity } = useApp();
  const [pending, setPending] = useState<CommunityPost[]>([]);
  const [reports, setReports] = useState<OpenReport[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([cloud.fetchPendingPosts(), cloud.fetchOpenReports()]);
      setPending(p);
      setReports(r);
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
        <h1 className="text-xl font-extrabold">Admins only</h1>
        <Link to="/" className={btn("secondary")}>Back to my fridge</Link>
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
      <PageTitle title="Moderation" subtitle="Review tips before they appear to other parents." />
      {error && <Notice tone="warn"><span role="alert">{error}</span></Notice>}

      <section className="space-y-3" aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="text-xl font-extrabold">Pending tips ({pending.length})</h2>
        {pending.length === 0 && <Card className="text-sm text-ink-soft">Nothing waiting. 🎉</Card>}
        {pending.map((p) => (
          <Card key={p.id} className="space-y-2">
            <h3 className="font-extrabold">{p.title}</h3>
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
              <p className="text-xs font-bold text-ink-soft">Author says: no common allergens</p>
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
        <h2 id="reports-heading" className="text-xl font-extrabold">Open reports ({reports.length})</h2>
        {reports.length === 0 && <Card className="text-sm text-ink-soft">No open reports.</Card>}
        {reports.map((r) => (
          <Card key={r.id} className="space-y-2">
            <h3 className="font-extrabold">{r.postTitle}</h3>
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
