import type { ReactNode } from "react";
import { ALLERGENS } from "../types.ts";
import type { Allergen, NutrientBadge } from "../types.ts";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

/** Class names for buttons and link-buttons. */
export function btn(variant: Variant = "primary", extra = ""): string {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary: "bg-beet text-white shadow-sm hover:brightness-110",
    secondary: "bg-turmeric text-ink hover:brightness-105",
    ghost: "bg-transparent text-ink-soft hover:bg-turmeric-soft",
    danger: "bg-red-600 text-white hover:brightness-110",
  };
  return cx(base, variants[variant], extra);
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5", className)}>{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "min-h-11 rounded-full px-4 py-2 text-sm font-bold ring-1 transition active:scale-95",
        active ? "bg-spinach text-white ring-spinach" : "bg-white text-ink ring-black/10 hover:bg-turmeric-soft",
        className,
      )}
    >
      {children}
    </button>
  );
}

const BADGE_STYLES: Record<NutrientBadge, string> = {
  Calcium: "bg-sky-100 text-sky-900",
  Iron: "bg-rose-100 text-rose-900",
  Protein: "bg-amber-100 text-amber-900",
  Fiber: "bg-lime-100 text-lime-900",
  "Omega-3": "bg-teal-100 text-teal-900",
};

export function NutrientBadges({
  badges,
  highlight = [],
}: {
  badges: NutrientBadge[];
  highlight?: NutrientBadge[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <span
          key={b}
          className={cx(
            "rounded-full px-2.5 py-1 text-xs font-extrabold",
            BADGE_STYLES[b],
            highlight.includes(b) && "ring-2 ring-spinach",
          )}
        >
          {b} +
        </span>
      ))}
    </div>
  );
}

export function allergenLabel(id: Allergen): string {
  return ALLERGENS.find((a) => a.id === id)?.label ?? id;
}

export function AllergenChips({ allergens }: { allergens: Allergen[] }) {
  if (allergens.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-bold text-ink-soft">Contains:</span>
      {allergens.map((a) => (
        <span key={a} className="rounded-full bg-beet-soft px-2.5 py-1 text-xs font-extrabold text-beet">
          {allergenLabel(a)}
        </span>
      ))}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-3xl font-extrabold leading-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
    </header>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn" | "good";
  children: ReactNode;
}) {
  const tones = {
    info: "bg-turmeric-soft text-ink",
    warn: "bg-beet-soft text-ink",
    good: "bg-spinach-soft text-ink",
  };
  return <div className={cx("rounded-2xl px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}
