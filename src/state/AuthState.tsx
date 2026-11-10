import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { isAdmin as fetchIsAdmin } from "../lib/cloud.ts";
import { cloudEnabled, supabase } from "../lib/supabase.ts";

export interface AuthUser {
  id: string;
  email: string;
  confirmed: boolean;
}

interface AuthValue {
  /** False when Supabase keys are missing: the app runs local-only. */
  enabled: boolean;
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  /** Each action returns an error message, or null on success. */
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  sendMagicLink: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

function toUser(session: { user: { id: string; email?: string; email_confirmed_at?: string | null } } | null): AuthUser | null {
  if (!session) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    confirmed: Boolean(session.user.email_confirmed_at),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(cloudEnabled);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(toUser(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setAdmin(false);
      return;
    }
    let active = true;
    fetchIsAdmin().then((ok) => {
      if (active) setAdmin(ok);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Accounts are not configured for this deployment.";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return error ? error.message : null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return "Accounts are not configured for this deployment.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) return "Accounts are not configured for this deployment.";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ enabled: cloudEnabled, user, loading, isAdmin: admin, signUp, signIn, sendMagicLink, signOut }),
    [user, loading, admin, signUp, signIn, sendMagicLink, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
