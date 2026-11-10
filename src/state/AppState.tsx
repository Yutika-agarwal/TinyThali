import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  CommunityPost,
  CookEntry,
  KidProfile,
  SavedRecipe,
} from "../types.ts";
import { SAMPLE_POSTS } from "../data/community.ts";

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

export type ReactionType = "helpful" | "kidApproved";
type ReactionMap = Record<string, Partial<Record<ReactionType, boolean>>>;

interface AppState {
  onboarded: boolean;
  finishOnboarding: () => void;
  displayName: string;
  setDisplayName: (name: string) => void;

  kids: KidProfile[];
  activeKids: KidProfile[];
  setActiveKidIds: (ids: string[]) => void;
  saveKid: (kid: KidProfile) => void;
  removeKid: (id: string) => void;

  fridge: string[];
  toggleFridge: (id: string) => void;
  clearFridge: () => void;

  saved: SavedRecipe[];
  saveRecipe: (recipeId: string, boostIds: string[], postIds: string[]) => void;
  removeSaved: (id: string) => void;
  history: CookEntry[];
  addHistory: (entry: Omit<CookEntry, "id" | "cookedAt">) => void;

  posts: CommunityPost[];
  myPosts: CommunityPost[];
  addPost: (post: Omit<CommunityPost, "id" | "status" | "helpful" | "kidApproved" | "createdAt">) => void;
  reactions: ReactionMap;
  toggleReaction: (postId: string, type: ReactionType) => void;
  reported: string[];
  reportPost: (postId: string) => void;

  clearAll: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [onboarded, setOnboarded] = useStored<boolean>("onboarded", false);
  const [displayName, setDisplayName] = useStored<string>("displayName", "");
  const [kids, setKids] = useStored<KidProfile[]>("kids", []);
  const [activeKidIds, setActiveKidIds] = useStored<string[]>("activeKidIds", []);
  const [fridge, setFridge] = useStored<string[]>("fridge", []);
  const [saved, setSaved] = useStored<SavedRecipe[]>("saved", []);
  const [history, setHistory] = useStored<CookEntry[]>("history", []);
  const [myPosts, setMyPosts] = useStored<CommunityPost[]>("myPosts", []);
  const [reactions, setReactions] = useStored<ReactionMap>("reactions", {});
  const [reported, setReported] = useStored<string[]>("reported", []);

  // If nothing valid is selected, fall back to the first kid so filters are always on once a profile exists.
  const activeKids = useMemo(() => {
    const selected = kids.filter((k) => activeKidIds.includes(k.id));
    return selected.length > 0 ? selected : kids.slice(0, 1);
  }, [kids, activeKidIds]);

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
    (id: string) => setFridge((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setFridge],
  );

  const saveRecipe = useCallback(
    (recipeId: string, boostIds: string[], postIds: string[]) =>
      setSaved((prev) => [
        { id: uid(), recipeId, boostIds, postIds, savedAt: new Date().toISOString() },
        ...prev,
      ]),
    [setSaved],
  );

  const addHistory = useCallback(
    (entry: Omit<CookEntry, "id" | "cookedAt">) =>
      setHistory((prev) => [{ ...entry, id: uid(), cookedAt: new Date().toISOString() }, ...prev]),
    [setHistory],
  );

  const addPost = useCallback(
    (post: Omit<CommunityPost, "id" | "status" | "helpful" | "kidApproved" | "createdAt">) =>
      setMyPosts((prev) => [
        { ...post, id: uid(), status: "pending", helpful: 0, kidApproved: 0, createdAt: new Date().toISOString() },
        ...prev,
      ]),
    [setMyPosts],
  );

  const toggleReaction = useCallback(
    (postId: string, type: ReactionType) =>
      setReactions((prev) => ({
        ...prev,
        [postId]: { ...prev[postId], [type]: !prev[postId]?.[type] },
      })),
    [setReactions],
  );

  const reportPost = useCallback(
    (postId: string) => setReported((prev) => (prev.includes(postId) ? prev : [...prev, postId])),
    [setReported],
  );

  const clearAll = useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.assign("/");
  }, []);

  const value: AppState = {
    onboarded,
    finishOnboarding: () => setOnboarded(true),
    displayName,
    setDisplayName,
    kids,
    activeKids,
    setActiveKidIds,
    saveKid,
    removeKid,
    fridge,
    toggleFridge,
    clearFridge: () => setFridge([]),
    saved,
    saveRecipe,
    removeSaved: (id) => setSaved((prev) => prev.filter((s) => s.id !== id)),
    history,
    addHistory,
    posts: SAMPLE_POSTS,
    myPosts,
    addPost,
    reactions,
    toggleReaction,
    reported,
    reportPost,
    clearAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
