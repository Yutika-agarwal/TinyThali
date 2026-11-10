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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold">Cooking for:</span>
        {kids.map((k) => (
          <Chip key={k.id} active={activeIds.includes(k.id)} onClick={() => toggle(k.id)}>
            {k.nickname}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-ink-soft">
        {allergies.length > 0
          ? `Avoiding: ${allergies.map(allergenLabel).join(", ")}`
          : "No allergies listed."}
        {activeKids.length > 1 && " Using the youngest age and everyone's allergies."}
      </p>
    </div>
  );
}
