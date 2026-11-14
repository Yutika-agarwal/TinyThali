import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CommunityPost, CookEntry, KidProfile, SavedRecipe } from "../types.ts";
import { SAMPLE_POSTS } from "../data/community.ts";
import * as cloud from "../lib/cloud.ts";
import type { NewPost } from "../lib/cloud.ts";
import { cloudEnabled } from "../lib/supabase.ts";
import { useAuth } from "./AuthState.tsx";

const PREFIX = "tinythali:";

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/** useState that persists to localStorage. Reads and writes never throw. */
function useStored<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode, quota): keep working in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

function warn(message: string) {
  return (error: unknown) => console.warn(message, error);
}

function mergeById<T extends { id: string }>(local: T[], remote: T[], dateKey: keyof T): T[] {
  const ids = new Set(local.map((x) => x.id));
  const merged = [...local, ...remote.filter((r) => !ids.has(r.id))];
  return merged.sort((a, b) => String(b[dateKey]).localeCompare(String(a[dateKey])));
}

const DEFAULT_QUICK_PICKS = ["atta", "potato", "paneer", "moong", "spinach", "rice", "tomato", "carrot"];

const isSample = (postId: string) => postId.startsWith("sample-");

export type ReactionType = "helpful" | "kidApproved";
type ReactionMap = Record<string, Partial<Record<ReactionType, boolean>>>;

interface AppState {
  onboarded: boolean;
  finishOnboarding: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  /** Saves the display name to the account (no-op when signed out). */
  commitDisplayName: () => void;

  kids: KidProfile[];
  activeKids: KidProfile[];
  setActiveKidIds: (ids: string[]) => void;
  saveKid: (kid: KidProfile) => void;
  removeKid: (id: string) => void;

  fridge: string[];
  toggleFridge: (id: string) => void;
  /** Fridge ingredients ranked by how often they were added, for the quick-pick row. */
  quickPicks: string[];
  clearFridge: () => void;

  saved: SavedRecipe[];
  saveRecipe: (recipeId: string, boostIds: string[], postIds: string[]) => void;
  removeSaved: (id: string) => void;
  history: CookEntry[];
  addHistory: (entry: Omit<CookEntry, "id" | "cookedAt">) => void;

  posts: CommunityPost[];
  myPosts: CommunityPost[];
  /** Resolves to an error message, or null on success. */
  addPost: (post: NewPost) => Promise<string | null>;
  refreshCommunity: () => Promise<void>;
  reactions: ReactionMap;
  countFor: (post: CommunityPost, type: ReactionType) => number;
  toggleReaction: (postId: string, type: ReactionType) => void;
  reported: string[];
  reportPost: (postId: string) => void;

  clearAll: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const userId = user?.id ?? null;

  const [onboarded, setOnboarded] = useStored<boolean>("onboarded", false);
  const [displayName, setDisplayName] = useStored<string>("displayName", "");
  const [kids, setKids] = useStored<KidProfile[]>("kids", []);
  const [activeKidIds, setActiveKidIds] = useStored<string[]>("activeKidIds", []);
  const [fridge, setFridge] = useStored<string[]>("fridge", []);
  const [usage, setUsage] = useStored<Record<string, number>>("fridgeUsage", {});
  const [saved, setSaved] = useStored<SavedRecipe[]>("saved", []);
  const [history, setHistory] = useStored<CookEntry[]>("history", []);
  const [localPosts, setLocalPosts] = useStored<CommunityPost[]>("myPosts", []);
  const [reactions, setReactions] = useStored<ReactionMap>("reactions", {});
  const [reported, setReported] = useStored<string[]>("reported", []);

  const [cloudPosts, setCloudPosts] = useState<CommunityPost[]>([]);
  const [cloudMine, setCloudMine] = useState<CommunityPost[]>([]);
  /** The signed-in user's reactions when the feed was last loaded, so counts don't double count. */
  const [baseline, setBaseline] = useState<ReactionMap>({});

  // Latest values for async sync code, which must not read stale state.
  const savedRef = useRef(saved);
  const historyRef = useRef(history);
  const nameRef = useRef(displayName);
  savedRef.current = saved;
  historyRef.current = history;
  nameRef.current = displayName;

  // If nothing valid is selected, fall back to the first kid so filters are always on once a profile exists.
  const activeKids = useMemo(() => {
    const selected = kids.filter((k) => activeKidIds.includes(k.id));
    return selected.length > 0 ? selected : kids.slice(0, 1);
  }, [kids, activeKidIds]);

  // ---- Community feed ------------------------------------------------------

  const refreshCommunity = useCallback(async () => {
    if (!cloudEnabled) return;
    try {
      setCloudPosts(await cloud.fetchApprovedPosts());
      if (userId) {
        const [mine, mineReactions] = await Promise.all([cloud.fetchMyPosts(userId), cloud.fetchMyReactions()]);
        setCloudMine(mine);
        setReactions(mineReactions);
        setBaseline(mineReactions);
      } else {
        setCloudMine([]);
        setBaseline({});
      }
    } catch (error) {
      console.warn("Could not load the community feed", error);
    }
  }, [userId, setReactions]);

  useEffect(() => {
    void refreshCommunity();
  }, [refreshCommunity]);

  // ---- Account sync: merge on sign-in, clear private data on sign-out ------

  const previousUser = useRef<string | null>(null);
  useEffect(() => {
    if (!cloudEnabled) return;
    const previous = previousUser.current;
    previousUser.current = userId;

    if (!userId) {
      if (previous) {
        // Signed out: don't leave one parent's private data on a shared device.
        setSaved([]);
        setHistory([]);
        setReactions({});
        setLocalPosts([]);
      }
      return;
    }

    let active = true;
    void (async () => {
      try {
        const [remoteSaved, remoteHistory, remoteName] = await Promise.all([
          cloud.fetchSaved(),
          cloud.fetchHistory(),
          cloud.fetchDisplayName(userId),
        ]);
        if (!active) return;

        // Upload anything saved as a guest, then bring cloud items down.
        const remoteSavedIds = new Set(remoteSaved.map((s) => s.id));
        const remoteHistoryIds = new Set(remoteHistory.map((h) => h.id));
        await cloud.upsertSaved(savedRef.current.filter((s) => !remoteSavedIds.has(s.id)));
        await cloud.upsertHistory(historyRef.current.filter((h) => !remoteHistoryIds.has(h.id)));
        if (!active) return;

        setSaved((prev) => mergeById(prev, remoteSaved, "savedAt"));
        setHistory((prev) => mergeById(prev, remoteHistory, "cookedAt"));

        if (remoteName) setDisplayName(remoteName);
        else if (nameRef.current.trim()) void cloud.saveDisplayName(userId, nameRef.current);
      } catch (error) {
        console.warn("Could not sync your account", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, setSaved, setHistory, setReactions, setLocalPosts, setDisplayName]);

  // ---- Kids and fridge (always local) --------------------------------------

  const saveKid = useCallback(
    (kid: KidProfile) => {
      setKids((prev) =>
        prev.some((k) => k.id === kid.id) ? prev.map((k) => (k.id === kid.id ? kid : k)) : [...prev, kid],
      );
      setActiveKidIds((prev) => (prev.includes(kid.id) ? prev : [...prev, kid.id]));
    },
    [setKids, setActiveKidIds],
  );

  const removeKid = useCallback(
    (id: string) => {
      setKids((prev) => prev.filter((k) => k.id !== id));
      setActiveKidIds((prev) => prev.filter((x) => x !== id));
    },
    [setKids, setActiveKidIds],
  );

  const toggleFridge = useCallback(
    (id: string) => {
      if (!fridge.includes(id)) setUsage((u) => ({ ...u, [id]: (u[id] ?? 0) + 1 }));
      setFridge((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [fridge, setFridge, setUsage],
  );

  const quickPicks = useMemo(() => {
    const used = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    return [...new Set([...used, ...DEFAULT_QUICK_PICKS])].slice(0, 8);
  }, [usage]);

  // ---- Saved recipes and history (written through to the account) ----------

  const saveRecipe = useCallback(
    (recipeId: string, boostIds: string[], postIds: string[]) => {
      const item: SavedRecipe = { id: uid(), recipeId, boostIds, postIds, savedAt: new Date().toISOString() };
      setSaved((prev) => [item, ...prev]);
      if (cloudEnabled && userId) cloud.upsertSaved([item]).catch(warn("Could not save to your account"));
    },
    [setSaved, userId],
  );

  const removeSaved = useCallback(
    (id: string) => {
      setSaved((prev) => prev.filter((s) => s.id !== id));
      if (cloudEnabled && userId) cloud.deleteSaved(id).catch(warn("Could not remove from your account"));
    },
    [setSaved, userId],
  );

  const addHistory = useCallback(
    (entry: Omit<CookEntry, "id" | "cookedAt">) => {
      const item: CookEntry = { ...entry, id: uid(), cookedAt: new Date().toISOString() };
      setHistory((prev) => [item, ...prev]);
      if (cloudEnabled && userId) cloud.upsertHistory([item]).catch(warn("Could not save to your account"));
    },
    [setHistory, userId],
  );

  // ---- Community actions ---------------------------------------------------

  const addPost = useCallback(
    async (post: NewPost): Promise<string | null> => {
      if (cloudEnabled) {
        if (!userId) return "Please sign in to share a tip.";
        try {
          await cloud.submitPost(post);
          await refreshCommunity();
          return null;
        } catch (error) {
          return error instanceof Error ? error.message : "Could not share your tip.";
        }
      }
      setLocalPosts((prev) => [
        { ...post, id: uid(), status: "pending", helpful: 0, kidApproved: 0, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      return null;
    },
    [userId, refreshCommunity, setLocalPosts],
  );

  const toggleReaction = useCallback(
    (postId: string, type: ReactionType) => {
      const next = !reactions[postId]?.[type];
      const apply = (value: boolean) =>
        setReactions((prev) => ({ ...prev, [postId]: { ...prev[postId], [type]: value } }));
      apply(next);
      if (cloudEnabled && userId && !isSample(postId)) {
        cloud.setReaction(postId, type, next).catch((error) => {
          console.warn("Could not save your reaction", error);
          apply(!next);
        });
      }
    },
    [reactions, setReactions, userId],
  );

  const countFor = useCallback(
    (post: CommunityPost, type: ReactionType) => {
      const base = type === "helpful" ? post.helpful : post.kidApproved;
      return base + (reactions[post.id]?.[type] ? 1 : 0) - (baseline[post.id]?.[type] ? 1 : 0);
    },
    [reactions, baseline],
  );

  const reportPost = useCallback(
    (postId: string) => {
      setReported((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
      if (cloudEnabled && userId && !isSample(postId)) {
        cloud.reportPostCloud(postId).catch(warn("Could not send your report"));
      }
    },
    [setReported, userId],
  );

  const commitDisplayName = useCallback(() => {
    if (cloudEnabled && userId) cloud.saveDisplayName(userId, nameRef.current).catch(warn("Could not save your name"));
  }, [userId]);

  const clearAll = useCallback(async () => {
    try {
      if (cloudEnabled && userId) {
        await cloud.deleteMyAccount();
        await signOut();
      }
    } catch (error) {
      console.warn("Could not delete the account", error);
      window.alert("We couldn't delete your account just now. Please try again in a moment.");
      return;
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.assign("/");
  }, [userId, signOut]);

  // With accounts on, real tips replace the samples once any exist.
  const posts = useMemo(
    () => (cloudEnabled && cloudPosts.length > 0 ? cloudPosts : SAMPLE_POSTS),
    [cloudPosts],
  );
  const myPosts = cloudEnabled ? cloudMine : localPosts;

  const value: AppState = {
    onboarded,
    finishOnboarding: () => setOnboarded(true),
    displayName,
    setDisplayName,
    commitDisplayName,
    kids,
    activeKids,
    setActiveKidIds,
    saveKid,
    removeKid,
    fridge,
    toggleFridge,
    quickPicks,
    clearFridge: () => setFridge([]),
    saved,
    saveRecipe,
    removeSaved,
    history,
    addHistory,
    posts,
    myPosts,
    addPost,
    refreshCommunity,
    reactions,
    countFor,
    toggleReaction,
    reported,
    reportPost,
    clearAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
