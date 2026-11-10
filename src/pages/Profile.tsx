import { useState } from "react";
import KidForm from "../components/KidForm.tsx";
import { allergenLabel, btn, Card, Notice, PageTitle } from "../components/ui.tsx";
import { DIETS } from "../types.ts";
import type { KidProfile } from "../types.ts";
import { useApp } from "../state/AppState.tsx";

export default function Profile() {
  const { kids, saveKid, removeKid, displayName, setDisplayName, clearAll } = useApp();
  const [editing, setEditing] = useState<KidProfile | "new" | null>(null);

  return (
    <div className="space-y-5">
      <PageTitle title="Profile" subtitle="Your kids and your community name." />

      <Card>
        <label htmlFor="display" className="mb-1 block text-sm font-extrabold">
          Display name <span className="font-normal text-ink-soft">(shown on your community tips)</span>
        </label>
        <input
          id="display"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          placeholder="e.g. Meera"
          className="min-h-12 w-full rounded-2xl bg-cream px-4 ring-1 ring-black/10"
        />
        <p className="mt-2 text-xs text-ink-soft">Never use your child's name.</p>
      </Card>

      <section className="space-y-3" aria-labelledby="kids-heading">
        <h2 id="kids-heading" className="text-xl font-extrabold">Kid profiles</h2>

        {kids.length === 0 && editing === null && (
          <Notice tone="warn">No profiles yet, so allergen filtering is off. Add one to keep suggestions safe.</Notice>
        )}

        {kids.map((k) =>
          editing !== "new" && editing?.id === k.id ? (
            <Card key={k.id}>
              <KidForm
                initial={k}
                submitLabel="Save changes"
                onSave={(kid) => {
                  saveKid(kid);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            </Card>
          ) : (
            <Card key={k.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold">{k.nickname}</h3>
                  <p className="text-sm text-ink-soft">
                    Ages {k.ageBand} · {DIETS.find((d) => d.id === k.diet)?.label}
                    {k.picky && " · Picky eater"}
                  </p>
                  <p className="text-sm">
                    {k.allergies.length > 0
                      ? `Allergic to: ${k.allergies.map(allergenLabel).join(", ")}`
                      : "No allergies listed"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => setEditing(k)} className={btn("ghost", "min-h-11 px-3")}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove ${k.nickname}'s profile?`)) removeKid(k.id);
                    }}
                    className={btn("ghost", "min-h-11 px-3")}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          ),
        )}

        {editing === "new" ? (
          <Card>
            <KidForm
              submitLabel="Add kid"
              onSave={(kid) => {
                saveKid(kid);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </Card>
        ) : (
          <button type="button" onClick={() => setEditing("new")} className={btn("secondary", "w-full")}>
            + Add a kid
          </button>
        )}
      </section>

      <Card className="space-y-2">
        <h2 className="text-lg font-extrabold">Account</h2>
        <p className="text-sm text-ink-soft">
          Email sign-in is coming, so your saved recipes and history follow you across devices. For now everything
          is stored privately on this device.
        </p>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-lg font-extrabold">Privacy</h2>
        <p className="text-sm text-ink-soft">
          Tiny Thali only keeps a nickname, an age range and allergies for each kid, and none of it leaves this
          device in this version.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete all Tiny Thali data on this device? This can't be undone.")) clearAll();
          }}
          className={btn("danger", "w-full")}
        >
          Delete my data
        </button>
      </Card>
    </div>
  );
}
