import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { btn, Card, Chip, Notice, PageTitle } from "../components/ui.tsx";
import { createCheckout, myDonationTotal } from "../lib/cloud.ts";
import { dollarsToCents, PRESETS } from "../lib/donate.ts";
import { cloudEnabled } from "../lib/supabase.ts";
import { useAuth } from "../state/AuthState.tsx";

/** Pay what you want, including nothing. Everything works the same either way. */
export default function Support() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [choice, setChoice] = useState<number | "custom">(5);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [given, setGiven] = useState(0);

  useEffect(() => {
    if (cloudEnabled && user) myDonationTotal().then(setGiven).catch(() => undefined);
  }, [user]);

  const cents = choice === "custom" ? dollarsToCents(custom) : choice * 100;

  async function pay() {
    if (!cents) return;
    setBusy(true);
    setError("");
    try {
      window.location.assign(await createCheckout(cents));
    } catch {
      setError("Couldn't start the payment. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Support Tiny Thali" subtitle="Pay what you like. Paying nothing is completely fine." />

      {params.get("thanks") && <Notice tone="warn">Thank you! Your support keeps Tiny Thali going.</Notice>}
      {given > 0 && <p className="text-sm font-semibold text-spinach">You've supported Tiny Thali. Thank you.</p>}

      <Card className="space-y-4">
        <p className="text-sm text-ink-soft">
          Tiny Thali is free to use. If it helps your family, you can chip in. You get the same app whatever you choose.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Amount">
          {PRESETS.map((p) => (
            <Chip key={p} active={choice === p} onClick={() => setChoice(p)}>
              {p === 0 ? "Not now" : `$${p}`}
            </Chip>
          ))}
          <Chip active={choice === "custom"} onClick={() => setChoice("custom")}>Other</Chip>
        </div>
        {choice === "custom" && (
          <input
            inputMode="decimal"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Amount in dollars, $1 to $500"
            aria-label="Custom amount in dollars"
            className="min-h-12 w-full rounded-2xl bg-white px-4 ring-1 ring-black/10"
          />
        )}

        {choice === 0 ? (
          <Link to="/" className={btn("primary", "w-full")}>Keep cooking, free</Link>
        ) : !cloudEnabled ? (
          <p className="text-sm text-ink-soft">Payments aren't switched on in this copy of Tiny Thali.</p>
        ) : !user ? (
          <Link to="/login" className={btn("primary", "w-full")}>Sign in to chip in</Link>
        ) : (
          <button type="button" disabled={!cents || busy} onClick={pay} className={btn("primary", "w-full")}>
            {busy ? "Opening secure checkout…" : cents ? `Continue with $${(cents / 100).toFixed(2)}` : "Enter an amount"}
          </button>
        )}
        {error && <p className="text-sm font-semibold text-spinach">{error}</p>}
        <p className="text-xs text-ink-soft">
          Payments are handled by Stripe on its own secure page. We never see your card. This is a voluntary payment to
          support the app and is not a tax-deductible charitable donation.
        </p>
      </Card>
    </div>
  );
}
