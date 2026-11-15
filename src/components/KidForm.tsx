import { useState } from "react";
import type { FormEvent } from "react";
import { AGE_BANDS, ALLERGENS, DIETS, PICKY_TRAITS } from "../types.ts";
import type { AgeBand, Allergen, Diet, KidProfile, PickyTrait } from "../types.ts";
import { cleanAllergyWord } from "../lib/safety.ts";
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
  const [others, setOthers] = useState<string[]>(initial?.otherAllergies ?? []);
  const [showOther, setShowOther] = useState((initial?.otherAllergies ?? []).length > 0);
  const [otherDraft, setOtherDraft] = useState("");
  const [about, setAbout] = useState<PickyTrait[]>(initial?.pickyAbout ?? []);
  const [pickyNote, setPickyNote] = useState(initial?.pickyNote ?? "");

  function addOther() {
    const w = cleanAllergyWord(otherDraft);
    if (w && !others.includes(w)) setOthers((prev) => [...prev, w]);
    setOtherDraft("");
  }

  function toggleTrait(t: PickyTrait) {
    setAbout((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

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
    const draft = cleanAllergyWord(otherDraft);
    const allOthers = draft && !others.includes(draft) ? [...others, draft] : others;
    onSave({
      id: initial?.id ?? uid(),
      nickname: nickname.trim() || "My kid",
      ageBands: AGE_BANDS.filter((b) => ageBands.includes(b)),
      allergies,
      otherAllergies: allOthers,
      diet,
      picky,
      pickyAbout: picky ? about : [],
      pickyNote: picky && pickyNote.trim() ? pickyNote.trim().slice(0, 120) : undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Name or nickname (optional)" aria-label="Nickname"
          maxLength={30}
          className="min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Age</legend>
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
          <Chip active={showOther} onClick={() => setShowOther((v) => !v)}>
            Other
          </Chip>
        </div>
        {showOther && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={otherDraft}
                onChange={(e) => setOtherDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOther();
                  }
                }}
                placeholder="e.g. kiwi, mustard"
                aria-label="Another allergy"
                maxLength={30}
                className="min-h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 ring-1 ring-black/10"
              />
              <button type="button" onClick={addOther} className={btn("secondary")}>
                Add
              </button>
            </div>
            {others.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {others.map((w) => (
                  <Chip key={w} active onClick={() => setOthers((prev) => prev.filter((x) => x !== w))}>
                    {w} ✕
                  </Chip>
                ))}
              </div>
            )}
            <p className="text-xs text-ink-soft">We hide anything that mentions it. Still check labels.</p>
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Diet</legend>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <Chip key={d.id} active={diet === d.id} onClick={() => setDiet(d.id)}>
              {d.label}
            </Chip>
          ))}
          <Chip active={picky} onClick={() => setPicky((v) => !v)}>
            Picky eater
          </Chip>
        </div>
      </fieldset>

      {picky && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {PICKY_TRAITS.map((t) => (
              <Chip key={t.id} active={about.includes(t.id)} onClick={() => toggleTrait(t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <input
            value={pickyNote}
            onChange={(e) => setPickyNote(e.target.value)}
            placeholder="What is it? (optional)"
            aria-label="More about the picky eating"
            maxLength={120}
            className="min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10"
          />
        </div>
      )}

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
