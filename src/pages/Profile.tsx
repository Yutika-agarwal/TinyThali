import { useState } from "react";
import { Link } from "react-router-dom";
import KidForm from "../components/KidForm.tsx";
import { allergenLabel, btn, Card, Notice, PageTitle } from "../components/ui.tsx";
import { DIETS } from "../types.ts";
import type { KidProfile } from "../types.ts";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";

export default function Profile() {
  const { kids, saveKid, removeKid, displayName, setDisplayName, commitDisplayName, clearAll } = useApp();
  const { enabled, user, loading, isAdmin, signOut } = useAuth();
  const [editing, setEditing] = useState<KidProfile | "new" | null>(null);

  return (
    <div className="space-y-5">
      <PageTitle title="Profile" />

      <section className="space-y-3" aria-label="Kids">
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
                    Ages {k.ageBands.join(", ")} · {DIETS.find((d) => d.id === k.diet)?.label}
                    {k.picky && ` · Picky${k.pickyNote ? `: ${k.pickyNote}` : ""}`}
                  </p>
                  <p className="text-sm">
                    {k.allergies.length + k.otherAllergies.length > 0
                      ? `Allergic to: ${[...k.allergies.map(allergenLabel), ...k.otherAllergies].join(", ")}`
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
        {enabled && loading && <p className="text-sm text-ink-soft">Checking your sign-in…</p>}
        {enabled && !loading && !user && (
          <Link to="/login" className={btn("primary", "w-full")}>Sign in to save everywhere</Link>
        )}
        {enabled && user && (
          <>
            <p className="text-sm">Signed in as <strong>{user.email}</strong></p>
            {!user.confirmed && <Notice tone="warn">Please confirm your email to share community tips.</Notice>}
            <label htmlFor="display" className="block pt-1 text-sm font-extrabold">Name on your tips</label>
            <input
              id="display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={commitDisplayName}
              maxLength={30}
              placeholder="e.g. Meera (never your child's name)"
              className="min-h-12 w-full rounded-2xl bg-cream px-4 ring-1 ring-black/10"
            />
            {isAdmin && <Link to="/admin" className={btn("secondary", "w-full")}>Open moderation</Link>}
          </>
        )}
        <Link to="/community" className={btn("secondary", "w-full")}>💬 Tips from other parents</Link>
        <Link to="/support" className={btn("secondary", "w-full")}>💛 Support Tiny Thali</Link>
        {enabled && user && (
          <button type="button" onClick={() => void signOut()} className={btn("ghost", "w-full")}>Sign out</button>
        )}
      </Card>

      <p className="px-1 text-center text-xs text-ink-soft">
        Kid details stay on this device.{" "}
        <button
          type="button"
          className="font-bold underline"
          onClick={() => {
            const message = user
              ? "Delete your account and all your data, here and in the cloud? This can't be undone."
              : "Delete all Tiny Thali data on this device? This can't be undone.";
            if (window.confirm(message)) void clearAll();
          }}
        >
          Delete my data
        </button>
      </p>
    </div>
  );
}
