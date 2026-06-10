"use client";
// Sesión del STAFF: Supabase Auth + roles (owner/waiter/kitchen) para ruteo.
import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "./api";
import { hasSupabase } from "./config";
import { supabase } from "./supabase";
import type { StaffRoleRow } from "./types";

type AuthState = {
  initialized: boolean;
  session: Session | null;
  user: User | null;
  roles: StaffRoleRow[];
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithOAuth: (provider: "github" | "google") => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
};

function siteOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

const AuthContext = createContext<AuthState | null>(null);

function humanError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Confirma tu email antes de entrar.";
  if (m.includes("already registered")) return "Ese email ya tiene cuenta. Inicia sesión.";
  if (m.includes("password should be at least")) return "La contraseña es muy corta (mín. 6).";
  if (m.includes("unable to validate email")) return "Email inválido.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiados intentos. Espera un momento.";
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<StaffRoleRow[]>([]);
  const [initialized, setInitialized] = useState(false);

  async function loadRoles(accessToken?: string | null) {
    if (!supabase) return;
    try {
      const { roles } = await api.get<{ roles: StaffRoleRow[] }>("/me/roles", accessToken ?? null);
      setRoles(roles ?? []);
    } catch {
      setRoles([]);
    }
  }

  useEffect(() => {
    if (!supabase) {
      setInitialized(true);
      return;
    }
    // Cargamos roles SOLO cuando cambia el usuario (no en cada TOKEN_REFRESHED) y
    // NUNCA llamamos funciones de Supabase dentro del callback (callback no-async,
    // token explícito). Antes eso causaba un bucle de /me/roles que saturaba las
    // conexiones y dejaba /home colgado en el spinner.
    let lastUid: string | null | undefined = undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const uid = data.session?.user?.id ?? null;
      if (uid !== lastUid) {
        lastUid = uid;
        if (data.session) void loadRoles(data.session.access_token);
      }
      setInitialized(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      const uid = s?.user?.id ?? null;
      if (uid === lastUid) return; // mismo usuario → no recargar (corta el bucle)
      lastUid = uid;
      if (s) void loadRoles(s.access_token);
      else setRoles([]);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initialized,
      session,
      user: session?.user ?? null,
      roles,
      signInWithPassword: async (email, password) => {
        if (!supabase) throw new Error("Supabase no está configurado.");
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(humanError(error.message));
      },
      signUp: async (email, password) => {
        if (!supabase) throw new Error("Supabase no está configurado.");
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw new Error(humanError(error.message));
        return { needsConfirmation: !data.session };
      },
      signInWithMagicLink: async (email) => {
        if (!supabase) throw new Error("Supabase no está configurado.");
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: siteOrigin() },
        });
        if (error) throw new Error(humanError(error.message));
      },
      signInWithOAuth: async (provider) => {
        if (!supabase) throw new Error("Supabase no está configurado.");
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: siteOrigin() },
        });
        if (error) throw new Error(humanError(error.message));
      },
      resetPassword: async (email) => {
        if (!supabase) throw new Error("Supabase no está configurado.");
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${siteOrigin()}/reset`,
        });
        if (error) throw new Error(humanError(error.message));
      },
      updatePassword: async (password) => {
        if (!supabase) throw new Error("Supabase no está configurado.");
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(humanError(error.message));
      },
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setRoles([]);
      },
      resendConfirmation: async (email) => {
        if (!supabase) return;
        const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
        if (error) throw new Error(humanError(error.message));
      },
    }),
    [initialized, session, roles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export { hasSupabase };
