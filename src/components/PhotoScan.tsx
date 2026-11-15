import { useRef, useState } from "react";
import { INGREDIENT_BY_ID } from "../data/ingredients.ts";
import { btn, Chip, Notice } from "./ui.tsx";
import { identifyIngredients } from "../lib/cloud.ts";
import { resizeToJpegBase64 } from "../lib/photo.ts";
import { combinedAllergies } from "../lib/safety.ts";
import { cloudEnabled } from "../lib/supabase.ts";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import Glyph from "./Glyph.tsx";

/** "Snap your fridge": take or pick a photo, confirm what we found, add it to the fridge. */
export default function PhotoScan() {
  const { fridge, toggleFridge, activeKids } = useApp();
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "scanning" | "review" | "error">("idle");
  const [found, setFound] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const allergies = combinedAllergies(activeKids);

  if (!cloudEnabled) return null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setState("scanning");
    try {
      const ids = await identifyIngredients(await resizeToJpegBase64(file));
      setFound(ids);
      setPicked(ids.filter((id) => !fridge.includes(id)));
      setState("review");
    } catch {
      setState("error");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  function add() {
    picked.forEach((id) => !fridge.includes(id) && toggleFridge(id));
    setState("idle");
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Take or choose a photo of your ingredients"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={!user || state === "scanning"}
        onClick={() => input.current?.click()}
        aria-label="Scan ingredients from a photo"
        title={user ? "Scan a photo of your ingredients" : "Sign in to scan a photo. Your photo is not saved."}
        className="grid min-h-12 w-14 shrink-0 place-items-center rounded-2xl bg-white text-2xl ring-1 ring-black/10 disabled:opacity-40"
      >
        {state === "scanning" ? "…" : "📸"}
      </button>

      {state === "error" && (
        <div className="fixed inset-x-0 bottom-24 z-20 mx-auto max-w-md px-4">
          <Notice tone="warn">Couldn't read that photo. Try better light, or tap ingredients instead.</Notice>
        </div>
      )}

      {state === "review" && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md space-y-3 rounded-t-3xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
          {found.length === 0 ? (
            <p className="text-sm">We couldn't spot any ingredients. Try a closer photo, or tap them below.</p>
          ) : (
            <>
              <p className="text-sm font-bold">Here's what we found. Untick anything wrong.</p>
              <div className="flex flex-wrap gap-2">
                {found.map((id) => {
                  const i = INGREDIENT_BY_ID[id];
                  if (!i) return null;
                  const flagged = i.allergens.some((a) => allergies.includes(a));
                  return (
                    <Chip
                      key={id}
                      active={picked.includes(id)}
                      onClick={() => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
                    >
                      <Glyph kind="ing" id={i.id} emoji={i.emoji} /> {i.name}
                      {flagged && <span aria-label="on your allergy list"> ⚠️</span>}
                    </Chip>
                  );
                })}
              </div>
              <p className="text-xs text-ink-soft">Photos can miss things or mix them up. Check the list.</p>
            </>
          )}
          <div className="flex gap-2">
            {found.length > 0 && (
              <button type="button" onClick={add} disabled={picked.length === 0} className={btn("primary", "flex-1")}>
                Add {picked.length} to my fridge
              </button>
            )}
            <button type="button" onClick={() => setState("idle")} className={btn("secondary")}>
              {found.length > 0 ? "Cancel" : "Close"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
