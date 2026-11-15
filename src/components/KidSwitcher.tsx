import { Link } from "react-router-dom";
import { useApp } from "../state/AppState.tsx";
import { combinedAllergies } from "../lib/safety.ts";
import { allergenLabel, Chip, Notice } from "./ui.tsx";

/** "Cooking for:" selector. With several kids selected, results are safe for all of them. */
export default function KidSwitcher() {
  const { kids, activeKids, setActiveKidIds } = useApp();

  if (kids.length === 0) {
    return (
      <Notice tone="warn">
        <strong>Allergen filtering is off.</strong> Add a kid profile so Tiny Thali can hide recipes and boosts
        that aren't safe.{" "}
        <Link to="/profile" className="font-extrabold text-beet underline">
          Add profile
        </Link>
      </Notice>
    );
  }

  const activeIds = activeKids.map((k) => k.id);
  const allergies = combinedAllergies(activeKids);

  function toggle(id: string) {
    const next = activeIds.includes(id) ? activeIds.filter((x) => x !== id) : [...activeIds, id];
    // Keep at least one kid selected so filtering never silently turns off.
    if (next.length > 0) setActiveKidIds(next);
  }

  const names = activeKids.map((k) => k.nickname).join(", ");
  const summary = `${names}${allergies.length > 0 ? ` · No ${allergies.map(allergenLabel).join(", ")}` : " · No allergies"}`;

  return (
    <details className="rounded-2xl bg-white px-3 py-2 ring-1 ring-black/10">
      <summary className="flex min-h-9 cursor-pointer items-center justify-between gap-2 text-sm font-extrabold">
        <span className="truncate">👶 {summary}</span>
        <span aria-hidden className="text-ink-soft">▾</span>
      </summary>
      <div className="mt-2 space-y-2 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          {kids.map((k) => (
            <Chip key={k.id} active={activeIds.includes(k.id)} onClick={() => toggle(k.id)}>
              {k.nickname}
            </Chip>
          ))}
        </div>
        {activeKids.length > 1 && (
          <p className="text-xs text-ink-soft">Using the youngest age and everyone's allergies.</p>
        )}
      </div>
    </details>
  );
}
