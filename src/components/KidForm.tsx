import { useState } from "react";
import type { FormEvent } from "react";
import { AGE_BANDS, ALLERGENS, DIETS } from "../types.ts";
import type { AgeBand, Allergen, Diet, KidProfile } from "../types.ts";
import { uid } from "../state/AppState.tsx";
import { btn, Chip } from "./ui.tsx";

interface Props {
  initial?: KidProfile;
  submitLabel: string;
  onSave: (kid: KidProfile) => void;
  onCancel?: () => void;
}

export default function KidForm({ initial, submitLabel, onSave, onCancel }: Props) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [ageBands, setAgeBands] = useState<AgeBand[]>(initial?.ageBands ?? ["4-8"]);
  const [allergies, setAllergies] = useState<Allergen[]>(initial?.allergies ?? []);
  const [diet, setDiet] = useState<Diet>(initial?.diet ?? "vegetarian");
  const [picky, setPicky] = useState(initial?.picky ?? false);

  function toggleAllergen(a: Allergen) {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function toggleBand(b: AgeBand) {
    setAgeBands((prev) =>
      prev.includes(b) ? (prev.length > 1 ? prev.filter((x) => x !== b) : prev) : [...prev, b],
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      id: initial?.id ?? uid(),
      nickname: nickname.trim() || "My kid",
      ageBands: AGE_BANDS.filter((b) => ageBands.includes(b)),
      allergies,
      diet,
      picky,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="nickname" className="mb-1 block text-sm font-extrabold">
          Nickname
        </label>
        <input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Little chef"
          maxLength={30}
          className="min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Ages <span className="font-normal text-ink-soft">(pick all that apply)</span></legend>
        <div className="flex gap-2">
          {AGE_BANDS.map((b) => (
            <Chip key={b} active={ageBands.includes(b)} onClick={() => toggleBand(b)}>
              {b} yrs
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-extrabold">Allergies</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <Chip key={a.id} active={allergies.includes(a.id)} onClick={() => toggleAllergen(a.id)}>
              {a.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Diet</legend>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <Chip key={d.id} active={diet === d.id} onClick={() => setDiet(d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-12 items-center gap-3 text-sm font-bold">
        <input
          type="checkbox"
          checked={picky}
          onChange={(e) => setPicky(e.target.checked)}
          className="size-5 accent-beet"
        />
        Picky eater
      </label>

      <div className="flex gap-2">
        <button type="submit" className={btn("primary", "flex-1")}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={btn("ghost")}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
