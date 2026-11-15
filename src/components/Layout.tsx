import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useApp } from "../state/AppState.tsx";
import { useAuth } from "../state/AuthState.tsx";
import { cx } from "./ui.tsx";

export const SAFETY_NOTE =
  "Tiny Thali offers general ideas, not medical advice. Always check packaged ingredient labels, talk to your pediatrician about allergies or feeding concerns, and grind seeds for kids under 4.";

const TABS = [
  { to: "/", label: "Ingredients", icon: `<path d="M4 11h16l-1.5 8a2 2 0 0 1-2 1.6h-9a2 2 0 0 1-2-1.6L4 11Z"/><path d="M8 11 12 4l4 7"/>`, end: true },
  { to: "/boost", label: "Boost", icon: `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>`, end: false },
  { to: "/saved", label: "Saved", icon: `<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>`, end: false },
  { to: "/profile", label: "Profile", icon: `<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.7-5.5 7-5.5s6.2 1.9 7 5.5"/>`, end: false },
];

export function Wordmark() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 text-xl font-semibold text-ink">
      <span aria-hidden className="text-2xl">🍛</span>
      <span>
        Tiny <span className="text-spinach">Thali</span>
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
          <Link to="/login" className="min-h-11 rounded-full px-4 py-2.5 text-sm font-semibold text-spinach ring-1 ring-spinach">
            Sign in
          </Link>
        )}
      </div>
      <main>
        <Outlet />
      </main>
      <details className="mt-8 text-xs text-ink-soft">
        <summary className="cursor-pointer font-semibold">Safety and info</summary>
        <p className="mt-2 leading-relaxed">{SAFETY_NOTE}</p>
        <p className="mt-2 flex flex-wrap gap-3 font-semibold text-spinach">
          <Link to="/support">Support</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms and safety</Link>
          <Link to="/guidelines">Guidelines</Link>
        </p>
      </details>

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
                    "flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                    isActive ? "text-spinach" : "text-ink-soft",
                  )
                }
              >
                <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: t.icon }} />
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
