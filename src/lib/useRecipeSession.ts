import { useParams, useSearchParams } from "react-router-dom";
import { RECIPE_BY_ID } from "../data/recipes.ts";
import { useApp } from "../state/AppState.tsx";
import { pruneSelected, toggleBoost, visibleBoosts } from "./boosts.ts";
import { checkPost, checkRecipe, dietAllows } from "./safety.ts";

function split(value: string | null): string[] {
  return (value ?? "").split(",").filter(Boolean);
}

/**
 * Everything the recipe and cook pages need: the recipe, what is safe for the selected
 * kids, and which boosts are switched on. The selection lives in the URL (?b=...&p=...)
 * so it survives refreshes and can move from the recipe page to cook mode.
 */
export function useRecipeSession() {
  const { id } = useParams();
  const recipe = id ? RECIPE_BY_ID[id] : undefined;
  const { activeKids, posts, reported } = useApp();
  const [params, setParams] = useSearchParams();

  if (!recipe) return null;

  const safety = checkRecipe(recipe, activeKids);
  const fits = safety.status !== "blocked" && dietAllows(recipe, activeKids);
  const options = visibleBoosts(recipe, activeKids);

  const recipePosts = posts.filter((p) => p.recipeId === recipe.id && !reported.includes(p.id));
  const allowedPosts = recipePosts.filter((p) => checkPost(p, activeKids).ok);
  const hiddenPostCount = recipePosts.length - allowedPosts.length;

  const boostIds = pruneSelected(split(params.get("b")), options.allowed);
  const postIds = split(params.get("p")).filter((pid) => allowedPosts.some((p) => p.id === pid));
  const selectedPosts = allowedPosts.filter((p) => postIds.includes(p.id));

  function write(nextBoosts: string[], nextPosts: string[]) {
    const next = new URLSearchParams();
    if (nextBoosts.length) next.set("b", nextBoosts.join(","));
    if (nextPosts.length) next.set("p", nextPosts.join(","));
    setParams(next, { replace: true });
  }

  return {
    recipe,
    safety,
    fits,
    options,
    allowedPosts,
    hiddenPostCount,
    boostIds,
    postIds,
    selectedPosts,
    query: (() => {
      const q = new URLSearchParams();
      if (boostIds.length) q.set("b", boostIds.join(","));
      if (postIds.length) q.set("p", postIds.join(","));
      const s = q.toString();
      return s ? `?${s}` : "";
    })(),
    setBoostIds: (ids: string[]) => write(ids, postIds),
    toggleBoostId: (boostId: string) => write(toggleBoost(boostIds, boostId), postIds),
    togglePostId: (postId: string) =>
      write(boostIds, postIds.includes(postId) ? postIds.filter((x) => x !== postId) : [...postIds, postId]),
  };
}
