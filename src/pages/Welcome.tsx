import { useNavigate } from "react-router-dom";
import { Wordmark } from "../components/Layout.tsx";
import KidForm from "../components/KidForm.tsx";
import { btn, Card } from "../components/ui.tsx";
import { useApp } from "../state/AppState.tsx";

export default function Welcome() {
  const { saveKid, finishOnboarding } = useApp();
  const navigate = useNavigate();

  function done() {
    finishOnboarding();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-8">
      <Wordmark />
      <h1 className="mt-6 text-4xl font-extrabold leading-tight">
        Same favorite food. <span className="text-beet">Stronger in every bite.</span>
      </h1>
      <p className="mt-3 text-ink-soft">
        Tell us what's in your fridge and we'll suggest Indian home recipes your kids will eat, plus small,
        kid-safe boosts that add nutrition.
      </p>

      <Card className="mt-6">
        <h2 className="mb-1 text-xl font-extrabold">Who are you cooking for?</h2>
        <p className="mb-4 text-sm text-ink-soft">
          This keeps allergens out of every suggestion. You can add more kids later, and it all stays on this
          device.
        </p>
        <KidForm
          submitLabel="Save and start cooking"
          onSave={(kid) => {
            saveKid(kid);
            done();
          }}
        />
      </Card>

      <button type="button" onClick={done} className={btn("ghost", "mt-3 w-full")}>
        Skip for now (allergen filtering will be off)
      </button>
    </div>
  );
}
