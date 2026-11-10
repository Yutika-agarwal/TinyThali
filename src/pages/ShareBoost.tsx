import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { RECIPES } from "../data/recipes.ts";
import { AGE_BANDS, ALLERGENS } from "../types.ts";
import type { AgeBand, Allergen, Reaction } from "../types.ts";
import { btn, Card, Chip, Notice, PageTitle } from "../components/ui.tsx";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";

const DAILY_LIMIT = 5;
const MEDICAL_CLAIM = /\b(cure[sd]?|cures|treat(s|ed|ment)?|prevent(s|ed|ion)?|heal(s|ed)?|detox(es)?|reverse[sd]?)\b/i;

const REACTIONS: { id: Reaction; label: string }[] = [
  { id: "loved", label: "😍 Loved it" },
  { id: "ate_some", label: "🙂 Ate some" },
  { id: "not_this_time", label: "😅 Not this time" },
];

const inputClass = "min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10";

export default function ShareBoost() {
  const { addPost, myPosts, displayName } = useApp();
  const { enabled, user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [recipeId, setRecipeId] = useState(RECIPES[0].id);
  const [title, setTitle] = useState("");
  const [whatAdded, setWhatAdded] = useState("");
  const [amount, setAmount] = useState("");
  const [whereInRecipe, setWhereInRecipe] = useState("");
  const [kidReaction, setKidReaction] = useState<Reaction>("loved");
  const [ageBand, setAgeBand] = useState<AgeBand>("4-8");
  const [tags, setTags] = useState<Allergen[]>([]);
  const [none, setNone] = useState(false);
  const [tasteNote, setTasteNote] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function toggleTag(a: Allergen) {
    setNone(false);
    setTags((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function pickNone() {
    setNone(!none);
    setTags([]);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const today = new Date().toDateString();
    const postedToday = myPosts.filter((p) => p.createdAt && new Date(p.createdAt).toDateString() === today).length;

    if (postedToday >= DAILY_LIMIT) {
      setError(`You can share up to ${DAILY_LIMIT} tips a day. Come back tomorrow!`);
      return;
    }
    if (!title.trim() || !whatAdded.trim() || !amount.trim() || !whereInRecipe.trim()) {
      setError("Please fill in the title, what you added, how much, and where it goes.");
      return;
    }
    if (!none && tags.length === 0) {
      setError('Please tick the allergens in your boost, or choose "None of these".');
      return;
    }
    if (MEDICAL_CLAIM.test([title, whatAdded, whereInRecipe, tasteNote].join(" "))) {
      setError(
        "Please describe what you did and how your kid reacted, without health claims like cures, treats or prevents.",
      );
      return;
    }

    setBusy(true);
    const failure = await addPost({
      recipeId,
      title: title.trim(),
      whatAdded: whatAdded.trim(),
      amount: amount.trim(),
      whereInRecipe: whereInRecipe.trim(),
      kidReaction,
      ageBand,
      allergenTags: tags,
      allergensConfirmed: true,
      tasteNote: tasteNote.trim() || undefined,
      authorName: displayName.trim() || "A Tiny Thali parent",
    });
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setError("");
    setSubmitted(true);
  }

  if (enabled && loading) return <p className="text-ink-soft">Checking your sign-in…</p>;

  if (enabled && !user) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>✍️</p>
        <h1 className="text-xl font-extrabold">Sign in to share a boost</h1>
        <p className="text-sm text-ink-soft">
          Signing in lets other parents know tips come from real accounts, and keeps spam out.
        </p>
        <Link to="/login" className={btn("primary")}>Sign in or create account</Link>
      </Card>
    );
  }

  if (enabled && user && !user.confirmed) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>📬</p>
        <h1 className="text-xl font-extrabold">Please confirm your email first</h1>
        <p className="text-sm text-ink-soft">
          We sent a confirmation link to {user.email}. Tap it, then come back here to share your boost.
        </p>
        <Link to="/community" className={btn("secondary")}>Back to community</Link>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-5xl" aria-hidden>🙏</p>
        <h1 className="text-2xl font-extrabold">Thanks for sharing!</h1>
        <p className="text-sm text-ink-soft">
          Your tip is saved as pending review. Once it's approved, other parents with a matching age and allergy
          profile will see it.
        </p>
        <Link to="/community" className={btn("primary")}>Back to community</Link>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Link to="/community" className="text-sm font-bold text-beet">← Community</Link>
      <PageTitle title="Share your boost" subtitle="How do you add nutrition to a favorite recipe?" />

      <div>
        <label htmlFor="recipe" className="mb-1 block text-sm font-extrabold">Recipe</label>
        <select id="recipe" value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className={inputClass}>
          {RECIPES.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-extrabold">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Ragi dough my picky eater didn't notice" className={inputClass} />
      </div>
      <div>
        <label htmlFor="what" className="mb-1 block text-sm font-extrabold">What did you add?</label>
        <input id="what" value={whatAdded} onChange={(e) => setWhatAdded(e.target.value)} maxLength={60} placeholder="e.g. Ground flaxseed" className={inputClass} />
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-extrabold">How much?</label>
        <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} maxLength={60} placeholder="e.g. 1 tsp per serving" className={inputClass} />
      </div>
      <div>
        <label htmlFor="where" className="mb-1 block text-sm font-extrabold">Where does it go in the recipe?</label>
        <input id="where" value={whereInRecipe} onChange={(e) => setWhereInRecipe(e.target.value)} maxLength={100} placeholder="e.g. Kneaded into the dough" className={inputClass} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">How did your kid react?</legend>
        <div className="flex flex-wrap gap-2">
          {REACTIONS.map((r) => (
            <Chip key={r.id} active={kidReaction === r.id} onClick={() => setKidReaction(r.id)}>{r.label}</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Youngest age you'd suggest it for</legend>
        <div className="flex gap-2">
          {AGE_BANDS.map((b) => (
            <Chip key={b} active={ageBand === b} onClick={() => setAgeBand(b)}>{b} yrs</Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-extrabold">Allergens in your boost (required)</legend>
        <p className="mb-2 text-xs text-ink-soft">This keeps your tip away from kids with those allergies.</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <Chip key={a.id} active={tags.includes(a.id)} onClick={() => toggleTag(a.id)}>{a.label}</Chip>
          ))}
          <Chip active={none} onClick={pickNone}>None of these</Chip>
        </div>
      </fieldset>

      <div>
        <label htmlFor="taste" className="mb-1 block text-sm font-extrabold">Taste or texture note (optional)</label>
        <textarea id="taste" value={tasteNote} onChange={(e) => setTasteNote(e.target.value)} maxLength={200} rows={3} className="w-full rounded-2xl bg-white p-4 ring-1 ring-black/10" />
      </div>

      {error && <Notice tone="warn"><span role="alert">{error}</span></Notice>}

      <button type="submit" disabled={busy} className={btn("primary", "w-full")}>
        {busy ? "Submitting…" : "Submit for review"}
      </button>
      <p className="text-xs text-ink-soft">
        Tips are reviewed before they appear. Please don't include photos of children or health claims.
      </p>
    </form>
  );
}
