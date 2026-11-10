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
      <PageTitle title="Profile" subtitle="Your kids and your community name." />

      <Card>
        <label htmlFor="display" className="mb-1 block text-sm font-extrabold">
          Display name <span className="font-normal text-ink-soft">(shown on your community tips)</span>
        </label>
        <input
          id="display"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onBlur={commitDisplayName}
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
        {!enabled && (
          <p className="text-sm text-ink-soft">
            Accounts aren't switched on in this copy of Tiny Thali, so everything is stored privately on this device.
          </p>
        )}
        {enabled && loading && <p className="text-sm text-ink-soft">Checking your sign-in…</p>}
        {enabled && !loading && !user && (
          <>
            <p className="text-sm text-ink-soft">
              Sign in with your email to keep saved recipes and history on every device, and to share boosts with
              the community.
            </p>
            <Link to="/login" className={btn("primary", "w-full")}>Sign in or create account</Link>
          </>
        )}
        {enabled && user && (
          <>
            <p className="text-sm">
              Signed in as <strong>{user.email}</strong>
            </p>
            {!user.confirmed && (
              <Notice tone="warn">Please confirm your email (check your inbox) to share community tips.</Notice>
            )}
            {isAdmin && (
              <Link to="/admin" className={btn("secondary", "w-full")}>Open moderation</Link>
            )}
            <button type="button" onClick={() => void signOut()} className={btn("ghost", "w-full")}>
              Sign out
            </button>
          </>
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="text-lg font-extrabold">Privacy</h2>
        <p className="text-sm text-ink-soft">
          Your kids' nickname, age range and allergies stay on this device and are never uploaded.
          {enabled && " With an account, your saved recipes, cooking history and community tips are stored securely so they follow you across devices."}
        </p>
        <button
          type="button"
          onClick={() => {
            const message = user
              ? "Delete your account and all your data, here and in the cloud? This can't be undone."
              : "Delete all Tiny Thali data on this device? This can't be undone.";
            if (window.confirm(message)) void clearAll();
          }}
          className={btn("danger", "w-full")}
        >
          Delete my data
        </button>
      </Card>
    </div>
  );
}
