import { track } from "../lib/usage.ts";
import { useApp } from "../state/AppState.tsx";
import { cx } from "./ui.tsx";

/** One tap to save or unsave a recipe. Saving keeps the boosts you have switched on. */
export default function SaveHeart({
  recipeId,
  boostIds = [],
  postIds = [],
  className,
}: {
  recipeId: string;
  boostIds?: string[];
  postIds?: string[];
  className?: string;
}) {
  const { saved, saveRecipe, removeSaved } = useApp();
  const entry = saved.find((s) => s.recipeId === recipeId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (entry) removeSaved(entry.id);
        else {
          saveRecipe(recipeId, boostIds, postIds);
          track("recipe_saved");
        }
      }}
      aria-pressed={!!entry}
      aria-label={entry ? "Remove from saved" : "Save recipe"}
      className={cx("grid size-11 shrink-0 place-items-center rounded-full text-2xl", className)}
    >
      <span aria-hidden>{entry ? "❤️" : "🤍"}</span>
    </button>
  );
}
