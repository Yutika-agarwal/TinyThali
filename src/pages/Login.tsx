import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { btn, Card, Chip, Notice, PageTitle } from "../components/ui.tsx";
import { useAuth } from "../state/AuthState.tsx";

type Mode = "signin" | "signup" | "magic";

const inputClass = "min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10";

export default function Login() {
  const { enabled, user, signIn, signUp, sendMagicLink } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<"confirm" | "magic" | null>(null);

  if (!enabled) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>🔒</p>
        <h1 className="text-xl font-extrabold">Accounts aren't switched on here</h1>
        <p className="text-sm text-ink-soft">
          This copy of Tiny Thali runs in local-only mode, so everything stays on your device.
        </p>
        <Link to="/" className={btn("secondary")}>Back to my fridge</Link>
      </Card>
    );
  }

  if (user) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-4xl" aria-hidden>👋</p>
        <h1 className="text-xl font-extrabold">You're signed in</h1>
        <p className="text-sm text-ink-soft">{user.email}</p>
        <Link to="/profile" className={btn("primary")}>Go to profile</Link>
      </Card>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }
    if (mode !== "magic" && password.length < 8) {
      setError("Please use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    let message: string | null;
    if (mode === "magic") message = await sendMagicLink(cleanEmail);
    else if (mode === "signup") message = await signUp(cleanEmail, password);
    else message = await signIn(cleanEmail, password);
    setBusy(false);

    if (message) {
      setError(message);
      return;
    }
    if (mode === "magic") setSent("magic");
    else if (mode === "signup") setSent("confirm");
    else navigate("/profile", { replace: true });
  }

  if (sent) {
    return (
      <Card className="space-y-3 text-center">
        <p className="text-5xl" aria-hidden>📬</p>
        <h1 className="text-2xl font-extrabold">Check your email</h1>
        <p className="text-sm text-ink-soft">
          {sent === "confirm"
            ? `We sent a confirmation link to ${email.trim()}. Tap it, then come back and sign in. You need a confirmed email to share community tips.`
            : `We sent a sign-in link to ${email.trim()}. Tap it on this device to sign in.`}
        </p>
        <Link to="/" className={btn("secondary")}>Back to my fridge</Link>
      </Card>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <PageTitle
        title={mode === "signup" ? "Create your account" : "Welcome back"}
        subtitle="Save recipes across devices and share boosts with other parents."
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sign-in method">
        <Chip active={mode === "signin"} onClick={() => setMode("signin")}>Sign in</Chip>
        <Chip active={mode === "signup"} onClick={() => setMode("signup")}>Create account</Chip>
        <Chip active={mode === "magic"} onClick={() => setMode("magic")}>Email me a link</Chip>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-extrabold">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>

      {mode !== "magic" && (
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-extrabold">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {error && <Notice tone="warn"><span role="alert">{error}</span></Notice>}

      <button type="submit" disabled={busy} className={btn("primary", "w-full")}>
        {busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "magic" ? "Send me a link" : "Sign in"}
      </button>

      <p className="text-xs text-ink-soft">
        Your kids' names, ages and allergies are never uploaded. Only your saved recipes, cooking history and
        community tips are stored with your account.
      </p>
    </form>
  );
}
