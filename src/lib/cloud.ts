import type {
  AgeBand,
  Allergen,
  CommunityPost,
  CookEntry,
  Reaction,
  SavedRecipe,
} from "../types.ts";
import { allowedIngredientIds, PANTRY_IDS, validateIdeas } from "./aiIdeas.ts";
import type { AiIdea } from "./aiIdeas.ts";
import { supabase } from "./supabase.ts";
import type { KidProfile } from "../types.ts";

/**
 * Everything that talks to Supabase lives here. Access control is enforced by
 * row-level security in supabase/migrations/0001_init.sql, never by this client code.
 */

function db() {
  if (!supabase) throw new Error("Accounts are not configured for this deployment.");
  return supabase;
}

function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Community posts
// ---------------------------------------------------------------------------

interface PostRow {
  id: string;
  user_id: string;
  recipe_id: string;
  title: string;
  what_added: string;
  amount: string;
  where_in_recipe: string;
  kid_reaction: Reaction;
  age_band: AgeBand;
  allergen_tags: Allergen[];
  allergens_confirmed: boolean;
  taste_note: string | null;
  author_name: string;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  created_at: string;
}

type CountMap = Record<string, { helpful: number; kid_approved: number }>;

function toPost(r: PostRow, counts: CountMap = {}): CommunityPost {
  const c = counts[r.id];
  return {
    id: r.id,
    recipeId: r.recipe_id,
    title: r.title,
    whatAdded: r.what_added,
    amount: r.amount,
    whereInRecipe: r.where_in_recipe,
    kidReaction: r.kid_reaction,
    ageBand: r.age_band,
    allergenTags: r.allergen_tags,
    allergensConfirmed: r.allergens_confirmed,
    tasteNote: r.taste_note ?? undefined,
    authorName: r.author_name,
    status: r.status,
    rejectReason: r.reject_reason ?? undefined,
    createdAt: r.created_at,
    helpful: c?.helpful ?? 0,
    kidApproved: c?.kid_approved ?? 0,
  };
}

async function fetchCounts(ids: string[]): Promise<CountMap> {
  if (ids.length === 0) return {};
  const { data, error } = await db()
    .from("post_counts")
    .select("post_id, helpful, kid_approved")
    .in("post_id", ids);
  check(error);
  const map: CountMap = {};
  for (const row of (data ?? []) as { post_id: string; helpful: number; kid_approved: number }[]) {
    map[row.post_id] = { helpful: row.helpful, kid_approved: row.kid_approved };
  }
  return map;
}

export async function fetchApprovedPosts(): Promise<CommunityPost[]> {
  const { data, error } = await db()
    .from("community_posts")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);
  check(error);
  const rows = (data ?? []) as PostRow[];
  const counts = await fetchCounts(rows.map((r) => r.id));
  return rows.map((r) => toPost(r, counts));
}

export async function fetchMyPosts(userId: string): Promise<CommunityPost[]> {
  const { data, error } = await db()
    .from("community_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  check(error);
  return ((data ?? []) as PostRow[]).map((r) => toPost(r));
}

export type NewPost = Omit<
  CommunityPost,
  "id" | "status" | "helpful" | "kidApproved" | "createdAt" | "rejectReason" | "sample"
>;

/** The database sets status, author name and enforces the daily limit and health-claim rules. */
export async function submitPost(post: NewPost): Promise<void> {
  const { error } = await db().from("community_posts").insert({
    recipe_id: post.recipeId,
    title: post.title,
    what_added: post.whatAdded,
    amount: post.amount,
    where_in_recipe: post.whereInRecipe,
    kid_reaction: post.kidReaction,
    age_band: post.ageBand,
    allergen_tags: post.allergenTags,
    allergens_confirmed: post.allergensConfirmed,
    taste_note: post.tasteNote ?? null,
  });
  check(error);
}

// ---------------------------------------------------------------------------
// Reactions and reports
// ---------------------------------------------------------------------------

export type ReactionKind = "helpful" | "kidApproved";
export type MyReactions = Record<string, Partial<Record<ReactionKind, boolean>>>;

export async function fetchMyReactions(): Promise<MyReactions> {
  const { data, error } = await db().from("post_reactions").select("post_id, type");
  check(error);
  const map: MyReactions = {};
  for (const row of (data ?? []) as { post_id: string; type: "helpful" | "kid_approved" }[]) {
    const kind: ReactionKind = row.type === "kid_approved" ? "kidApproved" : "helpful";
    map[row.post_id] = { ...map[row.post_id], [kind]: true };
  }
  return map;
}

export async function setReaction(postId: string, kind: ReactionKind, on: boolean): Promise<void> {
  const type = kind === "kidApproved" ? "kid_approved" : "helpful";
  if (on) {
    const { error } = await db().from("post_reactions").insert({ post_id: postId, type });
    // 23505 = already reacted; treat as success.
    if (error && (error as { code?: string }).code !== "23505") check(error);
  } else {
    const { error } = await db().from("post_reactions").delete().eq("post_id", postId).eq("type", type);
    check(error);
  }
}

export async function reportPostCloud(postId: string, reason: "allergen" | "unsafe" | "spam" | "other" = "other"): Promise<void> {
  const { error } = await db().from("post_reports").insert({ post_id: postId, reason });
  if (error && (error as { code?: string }).code !== "23505") check(error);
}

// ---------------------------------------------------------------------------
// Moderation (admin only; enforced by row-level security)
// ---------------------------------------------------------------------------

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await db().rpc("is_admin");
  if (error) return false;
  return data === true;
}

export async function fetchPendingPosts(): Promise<CommunityPost[]> {
  const { data, error } = await db()
    .from("community_posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  check(error);
  return ((data ?? []) as PostRow[]).map((r) => toPost(r));
}

export async function moderatePost(postId: string, status: "approved" | "rejected", reason?: string): Promise<void> {
  const { error } = await db()
    .from("community_posts")
    .update({ status, reject_reason: status === "rejected" ? (reason ?? null) : null })
    .eq("id", postId);
  check(error);
}

export interface OpenReport {
  id: string;
  postId: string;
  postTitle: string;
  reason: string;
  note?: string;
  createdAt: string;
}

export async function fetchOpenReports(): Promise<OpenReport[]> {
  const { data, error } = await db()
    .from("post_reports")
    .select("id, post_id, reason, note, created_at, community_posts(title)")
    .eq("status", "open")
    .order("created_at", { ascending: true });
  check(error);
  type Row = {
    id: string;
    post_id: string;
    reason: string;
    note: string | null;
    created_at: string;
    community_posts: { title: string } | { title: string }[] | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => {
    const post = Array.isArray(r.community_posts) ? r.community_posts[0] : r.community_posts;
    return {
      id: r.id,
      postId: r.post_id,
      postTitle: post?.title ?? "(deleted tip)",
      reason: r.reason,
      note: r.note ?? undefined,
      createdAt: r.created_at,
    };
  });
}

export async function resolveReport(reportId: string): Promise<void> {
  const { error } = await db().from("post_reports").update({ status: "resolved" }).eq("id", reportId);
  check(error);
}

// ---------------------------------------------------------------------------
// Saved recipes and cooking history (private to the account)
// ---------------------------------------------------------------------------

interface SavedRow {
  id: string;
  recipe_id: string;
  boost_ids: string[];
  post_ids: string[];
  saved_at: string;
}

interface HistoryRow {
  id: string;
  recipe_id: string;
  boost_ids: string[];
  post_ids: string[];
  reaction: Reaction;
  cooked_at: string;
}

export async function fetchSaved(): Promise<SavedRecipe[]> {
  const { data, error } = await db().from("saved_recipes").select("*").order("saved_at", { ascending: false });
  check(error);
  return ((data ?? []) as SavedRow[]).map((r) => ({
    id: r.id,
    recipeId: r.recipe_id,
    boostIds: r.boost_ids,
    postIds: r.post_ids,
    savedAt: r.saved_at,
  }));
}

export async function upsertSaved(items: SavedRecipe[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await db().from("saved_recipes").upsert(
    items.map((s) => ({
      id: s.id,
      recipe_id: s.recipeId,
      boost_ids: s.boostIds,
      post_ids: s.postIds,
      saved_at: s.savedAt,
    })),
  );
  check(error);
}

export async function deleteSaved(id: string): Promise<void> {
  const { error } = await db().from("saved_recipes").delete().eq("id", id);
  check(error);
}

export async function fetchHistory(): Promise<CookEntry[]> {
  const { data, error } = await db().from("cook_history").select("*").order("cooked_at", { ascending: false });
  check(error);
  return ((data ?? []) as HistoryRow[]).map((r) => ({
    id: r.id,
    recipeId: r.recipe_id,
    boostIds: r.boost_ids,
    postIds: r.post_ids,
    reaction: r.reaction,
    cookedAt: r.cooked_at,
  }));
}

export async function upsertHistory(items: CookEntry[]): Promise<void> {
  if (items.length === 0) return;
  const { error } = await db().from("cook_history").upsert(
    items.map((h) => ({
      id: h.id,
      recipe_id: h.recipeId,
      boost_ids: h.boostIds,
      post_ids: h.postIds,
      reaction: h.reaction,
      cooked_at: h.cookedAt,
    })),
  );
  check(error);
}

// ---------------------------------------------------------------------------
// Profile and account
// ---------------------------------------------------------------------------

export async function fetchDisplayName(userId: string): Promise<string> {
  const { data, error } = await db().from("profiles").select("display_name").eq("id", userId).maybeSingle();
  check(error);
  return (data as { display_name: string } | null)?.display_name ?? "";
}

export async function saveDisplayName(userId: string, name: string): Promise<void> {
  const { error } = await db().from("profiles").update({ display_name: name.trim().slice(0, 30) }).eq("id", userId);
  check(error);
}

export async function deleteMyAccount(): Promise<void> {
  const { error } = await db().rpc("delete_my_account");
  check(error);
}

// ---------------------------------------------------------------------------
// AI recipe ideas
// ---------------------------------------------------------------------------

/** Asks the edge function for ideas. Resolves to [] when accounts or the function are not set up. */
export async function fetchIdeas(fridge: string[], kids: KidProfile[]): Promise<AiIdea[]> {
  const allowed = allowedIngredientIds(fridge, kids);
  const fromFridge = fridge.filter((id) => allowed.includes(id));
  if (fromFridge.length === 0) return [];
  const { data, error } = await db().functions.invoke("suggest-recipes", {
    body: { fridge: fromFridge, pantry: PANTRY_IDS.filter((id) => allowed.includes(id)) },
  });
  if (error) throw new Error(error.message);
  return validateIdeas((data as { ideas?: unknown })?.ideas, allowed, kids);
}
