import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import { cx } from "./ui.tsx";

export const SAFETY_NOTE =
  "Tiny Thali offers general ideas, not medical advice. Always check packaged ingredient labels, talk to your pediatrician about allergies or feeding concerns, and grind seeds for kids under 4.";

const TABS = [
  { to: "/", label: "Fridge", icon: "🥕", end: true },
  { to: "/community", label: "Community", icon: "💬", end: false },
  { to: "/saved", label: "Saved", icon: "❤️", end: false },
  { to: "/profile", label: "Profile", icon: "🙂", end: false },
];

export function Wordmark() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 text-xl font-extrabold text-ink">
      <span aria-hidden className="text-2xl">🍛</span>
      <span>
        Tiny <span className="text-beet">Thali</span>
      </span>
    </Link>
  );
}

export default function Layout() {
  const { onboarded } = useApp();
  const { enabled, user, loading } = useAuth();
  if (!onboarded) return <Navigate to="/welcome" replace />;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-32 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <Wordmark />
        {enabled && !loading && !user && (
          <Link to="/login" className="min-h-11 rounded-full px-4 py-2.5 text-sm font-extrabold text-beet ring-1 ring-beet">
            Sign in
          </Link>
        )}
      </div>
      <main>
        <Outlet />
      </main>
      <p className="mt-8 text-xs leading-relaxed text-ink-soft">{SAFETY_NOTE}</p>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-black/5 bg-white/95 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-md pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cx(
                    "flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-bold",
                    isActive ? "text-beet" : "text-ink-soft",
                  )
                }
              >
                <span aria-hidden className="text-xl">{t.icon}</span>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
