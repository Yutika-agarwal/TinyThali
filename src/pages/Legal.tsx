import { Link } from "react-router-dom";
import { Card, PageTitle } from "../components/ui.tsx";

function Draft() {
  return (
    <p className="rounded-2xl bg-turmeric-soft p-3 text-sm font-bold">
      Draft for review. Have a lawyer check this before launch, and fill in the contact details.
    </p>
  );
}

export function Privacy() {
  return (
    <div className="space-y-4">
      <PageTitle title="Privacy" subtitle="Plain-language summary" />
      <Draft />
      <Card className="space-y-3 text-sm">
        <h2 className="text-lg font-extrabold">Kids' details stay on your device</h2>
        <p>
          Your children's nicknames, age groups and allergies are saved only in this browser, on this device. They are
          never uploaded to our servers. Tiny Thali is meant to be used by parents and caregivers, not by children.
        </p>
        <h2 className="text-lg font-extrabold">If you make an account</h2>
        <p>
          We store your email address, a display name, your saved recipes, your cooking history, and any community tips
          and reactions you post. Tips you share show your display name. You can delete your account and all of this
          from your Profile at any time.
        </p>
        <h2 className="text-lg font-extrabold">AI recipe ideas</h2>
        <p>
          "More from your fridge" sends only a list of ingredient names to an AI service to write recipe ideas. No kid
          details, no allergy information and no personal information are sent. Every idea is checked again on your
          device before it is shown.
        </p>
        <h2 className="text-lg font-extrabold">What we don't do</h2>
        <p>We don't sell your data, show ads, or share it with advertisers.</p>
        <h2 className="text-lg font-extrabold">Contact</h2>
        <p>Questions or deletion help: [your contact email here].</p>
      </Card>
      <Link to="/profile" className="text-sm font-bold text-beet">← Back</Link>
    </div>
  );
}

export function Terms() {
  return (
    <div className="space-y-4">
      <PageTitle title="Terms and safety" subtitle="Please read" />
      <Draft />
      <Card className="space-y-3 text-sm">
        <h2 className="text-lg font-extrabold">General ideas, not medical advice</h2>
        <p>
          Tiny Thali offers cooking ideas and nutrition add-ins. It is not medical or dietary advice. Talk to your
          pediatrician or a registered dietitian about allergies, feeding concerns and what is right for your child.
        </p>
        <h2 className="text-lg font-extrabold">Allergens</h2>
        <p>
          We filter recipes and boosts using the allergies you enter, but food labels, brands and kitchens vary. Always
          read packaged ingredient labels. Introduce new foods and allergens as your pediatrician advises.
        </p>
        <h2 className="text-lg font-extrabold">Choking and texture</h2>
        <p>
          Grind seeds and nuts finely for children under 4, avoid whole nuts, and cut foods to a safe size and texture
          for your child's age.
        </p>
        <h2 className="text-lg font-extrabold">Community tips</h2>
        <p>
          Tips come from other parents and are not reviewed by a dietitian. We may remove tips that break the
          <Link to="/guidelines" className="font-bold text-beet"> community guidelines</Link>.
        </p>
        <h2 className="text-lg font-extrabold">Your account</h2>
        <p>You are responsible for what you post and for keeping your sign-in secure. You can delete your account any time.</p>
      </Card>
    </div>
  );
}

export function Guidelines() {
  return (
    <div className="space-y-4">
      <PageTitle title="Community guidelines" subtitle="Keep it kind, safe and useful" />
      <Card className="space-y-2 text-sm">
        <ul className="list-disc space-y-2 pl-5">
          <li>Share what you actually did: what you added, how much, and where in the recipe.</li>
          <li>Tag every allergen in your tip. Tips with unconfirmed allergens are hidden from families with allergies.</li>
          <li>No medical or health claims (for example "cures", "treats", "boosts immunity").</li>
          <li>No advice about babies under 1, supplements, or replacing medical care.</li>
          <li>No ads, links or selling. No personal details about children.</li>
          <li>Be kind. Every tip is reviewed before it goes live, and we may remove tips that break these rules.</li>
        </ul>
      </Card>
    </div>
  );
}
