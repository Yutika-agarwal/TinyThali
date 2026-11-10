import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RECIPES, RECIPE_BY_ID } from "../data/recipes.ts";
import { AllergenChips, btn, Card, Chip, cx, Notice, PageTitle } from "../components/ui.tsx";
import KidSwitcher from "../components/KidSwitcher.tsx";
import { checkPost } from "../lib/safety.ts";
import { useApp } from "../state/AppState.tsx";
import type { ReactionType } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import type { CommunityPost, Reaction } from "../types.ts";

const REACTION_TEXT: Record<Reaction, string> = {
  loved: "😍 Loved it",
  ate_some: "🙂 Ate some",
  not_this_time: "😅 Not this time",
};

/** A tip counts as "kid approved" once enough parents have confirmed it worked. */
const KID_APPROVED_MIN = 5;

function PostCard({
  post,
  helpful,
  kidApproved,
  reacted,
  onReact,
  onReport,
}: {
  post: CommunityPost;
  helpful: number;
  kidApproved: number;
  reacted: Partial<Record<ReactionType, boolean>>;
  onReact?: (type: ReactionType) => void;
  onReport?: () => void;
}) {
  const recipe = RECIPE_BY_ID[post.recipeId];
  const pending = post.status !== "approved";

  return (
    <Card className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold leading-tight">{post.title}</h3>
          <p className="text-xs text-ink-soft">
            {recipe?.emoji} {recipe?.name} · by {post.authorName}
          </p>
        </div>
        {pending && (
          <span className="shrink-0 rounded-full bg-turmeric-soft px-2.5 py-1 text-xs font-extrabold">
            {post.status === "rejected" ? "Not approved" : "Pending review"}
          </span>
        )}
      </div>
      {post.status === "rejected" && post.rejectReason && (
        <p className="text-sm text-ink-soft">Reviewer note: {post.rejectReason}</p>
      )}

      <p className="text-sm">
        <strong>{post.whatAdded}</strong>: {post.amount}
      </p>
      <p className="text-sm text-ink-soft">{post.whereInRecipe}</p>
      {post.tasteNote && <p className="text-sm italic text-ink-soft">"{post.tasteNote}"</p>}

      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-black/5 px-2.5 py-1">Ages {post.ageBand}</span>
        <span className="rounded-full bg-black/5 px-2.5 py-1">{REACTION_TEXT[post.kidReaction]}</span>
        {post.allergenTags.length === 0 && post.allergensConfirmed && (
          <span className="rounded-full bg-spinach-soft px-2.5 py-1 text-spinach">No common allergens</span>
        )}
      </div>
      <AllergenChips allergens={post.allergenTags} />
      {post.sample && <p className="text-xs text-ink-soft">Sample tip to show how the community will look.</p>}

      {!pending && onReact && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onReact("helpful")}
            aria-pressed={!!reacted.helpful}
            className={cx("min-h-11 rounded-full px-4 text-sm font-extrabold ring-1", reacted.helpful ? "bg-beet text-white ring-beet" : "bg-white ring-black/10")}
          >
            👍 Helpful {helpful}
          </button>
          <button
            type="button"
            onClick={() => onReact("kidApproved")}
            aria-pressed={!!reacted.kidApproved}
            className={cx("min-h-11 rounded-full px-4 text-sm font-extrabold ring-1", reacted.kidApproved ? "bg-spinach text-white ring-spinach" : "bg-white ring-black/10")}
          >
            🧒 Kid approved {kidApproved}
          </button>
          <Link to={`/recipe/${post.recipeId}?p=${post.id}`} className="ml-auto text-sm font-extrabold text-beet">
            Try this boost →
          </Link>
        </div>
      )}
      {!pending && onReport && (
        <button type="button" onClick={onReport} className="text-xs font-bold text-ink-soft underline">
          Report this tip
        </button>
      )}
    </Card>
  );
}

export default function Community() {
  const { posts, myPosts, activeKids, reactions, countFor, toggleReaction, reported, reportPost } = useApp();
  const { enabled, user } = useAuth();
  const navigate = useNavigate();
  const [recipeId, setRecipeId] = useState("");
  const [kidApprovedOnly, setKidApprovedOnly] = useState(false);

  const count = countFor;

  /** With accounts on, reacting needs a sign-in (except on the sample tips). */
  function react(post: CommunityPost, type: ReactionType) {
    if (enabled && !user && !post.sample) {
      navigate("/login");
      return;
    }
    toggleReaction(post.id, type);
  }

  const candidates = posts.filter((p) => !reported.includes(p.id));
  const safe = candidates.filter((p) => checkPost(p, activeKids).ok);
  const hiddenCount = candidates.length - safe.length;

  const feed = safe
    .filter((p) => !recipeId || p.recipeId === recipeId)
    .filter((p) => !kidApprovedOnly || count(p, "kidApproved") >= KID_APPROVED_MIN);
  const top = [...safe].sort((a, b) => count(b, "helpful") - count(a, "helpful")).slice(0, 3);

  return (
    <div className="space-y-5">
      <PageTitle title="Community" subtitle="How parents boost their recipes at home." />
      <KidSwitcher />

      <Link to="/community/share" className={btn("primary", "w-full")}>
        Share your boost ✍️
      </Link>

      {top.length > 0 && (
        <section aria-labelledby="top-heading">
          <h2 id="top-heading" className="mb-2 text-xl font-extrabold">Top boosts this week 🔥</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {top.map((p) => (
              <Link
                key={p.id}
                to={`/recipe/${p.recipeId}?p=${p.id}`}
                className="w-56 shrink-0 rounded-3xl bg-turmeric-soft p-4"
              >
                <p className="text-2xl" aria-hidden>{RECIPE_BY_ID[p.recipeId]?.emoji}</p>
                <p className="mt-1 font-extrabold leading-tight">{p.title}</p>
                <p className="mt-1 text-xs font-bold text-ink-soft">👍 {count(p, "helpful")} found this helpful</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="recipe-filter">Filter by recipe</label>
        <select
          id="recipe-filter"
          value={recipeId}
          onChange={(e) => setRecipeId(e.target.value)}
          className="min-h-11 rounded-full bg-white px-4 text-sm font-bold ring-1 ring-black/10"
        >
          <option value="">All recipes</option>
          {RECIPES.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <Chip active={kidApprovedOnly} onClick={() => setKidApprovedOnly(!kidApprovedOnly)}>
          🧒 Kid approved
        </Chip>
      </div>

      {hiddenCount > 0 && (
        <Notice tone="warn">
          {hiddenCount} tip{hiddenCount === 1 ? " is" : "s are"} hidden because of your kid's allergies or age.
        </Notice>
      )}

      <div className="space-y-3">
        {feed.length === 0 && (
          <Card className="text-center text-sm text-ink-soft">No tips match these filters yet.</Card>
        )}
        {feed.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            helpful={count(p, "helpful")}
            kidApproved={count(p, "kidApproved")}
            reacted={reactions[p.id] ?? {}}
            onReact={(type) => react(p, type)}
            onReport={() => {
              if (window.confirm("Report this tip? It will be hidden for you.")) reportPost(p.id);
            }}
          />
        ))}
      </div>

      {myPosts.length > 0 && (
        <section aria-labelledby="mine-heading" className="space-y-3">
          <h2 id="mine-heading" className="text-xl font-extrabold">Your tips</h2>
          {myPosts.map((p) => (
            <PostCard key={p.id} post={p} helpful={0} kidApproved={0} reacted={{}} />
          ))}
        </section>
      )}
    </div>
  );
}
