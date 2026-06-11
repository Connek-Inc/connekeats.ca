"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GitHubIcon, MailIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const {
    signInWithPassword,
    signUp,
    signInWithMagicLink,
    signInWithOAuth,
    resetPassword,
    resendConfirmation,
  } = useAuth();
  const { show } = useToast();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function primary() {
    if (!emailOk) return show("Email inválido", "error");
    if (password.length < 6) return show("La contraseña debe tener al menos 6 caracteres", "error");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
        router.replace("/home");
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setAwaitingConfirm(true);
          show("Cuenta creada. Revisa tu correo para confirmar.", "success");
        } else {
          router.replace("/home");
        }
      }
    } catch (e) {
      show(e instanceof Error ? e.message : "Error de autenticación", "error");
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    if (!emailOk) return show("Escribe tu email primero", "error");
    try {
      await signInWithMagicLink(email);
      show("Te enviamos un enlace mágico a tu correo", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar el enlace", "error");
    }
  }

  async function oauth(provider: "github" | "google") {
    try {
      await signInWithOAuth(provider);
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo continuar", "error");
    }
  }

  async function forgot() {
    if (!emailOk) return show("Escribe tu email para recuperar la contraseña", "error");
    try {
      await resetPassword(email);
      show("Te enviamos un enlace para restablecer tu contraseña", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar", "error");
    }
  }

  const isSignin = mode === "signin";

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-surface p-7 sm:p-8 shadow-2xl">
        {/* Marca arriba + cambio de tema */}
        <div className="mb-7 flex items-center justify-between gap-2.5">
          <Logo className="h-8" />
          <ThemeToggle />
        </div>

        <h1 className="mb-7 text-[34px] font-semibold leading-none text-foreground">
          {isSignin ? "Sign In" : "Sign Up"}
        </h1>

        {/* Email */}
        <label className="mb-2 block text-[15px] font-medium text-foreground">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="mb-5 w-full rounded-2xl border border-foreground/10 bg-foreground/[0.05] px-5 py-3.5 text-foreground placeholder:text-foreground/35 outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-white/20"
        />

        {/* Password + forgot */}
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[15px] font-medium text-foreground">Password</label>
          <button type="button" onClick={forgot} className="text-[15px] text-foreground/45 hover:text-foreground/70">
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          onKeyDown={(e) => e.key === "Enter" && primary()}
          className="mb-6 w-full rounded-2xl border border-foreground/10 bg-foreground/[0.05] px-5 py-3.5 text-foreground placeholder:text-foreground/35 outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-white/20"
        />

        {/* Primary */}
        <button
          onClick={primary}
          disabled={loading}
          className="mb-3 w-full rounded-full bg-foreground py-4 text-center text-[16px] font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
        >
          {loading ? "..." : isSignin ? "Sign In" : "Sign Up"}
        </button>

        {/* Magic link */}
        <button
          onClick={magicLink}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.05] py-4 text-[16px] text-foreground transition hover:bg-foreground/[0.1]"
        >
          <MailIcon className="h-5 w-5 text-foreground/85" />
          Continue with Magic link
        </button>

        {/* OR */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-foreground/10" />
          <span className="text-sm text-foreground/40">OR</span>
          <div className="h-px flex-1 bg-foreground/10" />
        </div>

        {/* GitHub */}
        <button
          onClick={() => oauth("github")}
          className="mb-6 flex w-full items-center justify-center gap-2.5 rounded-full border border-foreground/10 bg-foreground/[0.05] py-4 text-[16px] text-foreground transition hover:bg-foreground/[0.1]"
        >
          <GitHubIcon className="h-5 w-5 text-foreground" />
          Continue with GitHub
        </button>

        {/* Toggle */}
        <p className="text-center text-[15px] text-foreground/75">
          {isSignin ? "Need to create an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setMode(isSignin ? "signup" : "signin");
              setAwaitingConfirm(false);
            }}
            className="font-medium text-foreground hover:underline"
          >
            {isSignin ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {awaitingConfirm && (
          <button
            onClick={async () => {
              try {
                await resendConfirmation(email);
                show("Correo de confirmación reenviado", "success");
              } catch (e) {
                show(e instanceof Error ? e.message : "No se pudo reenviar", "error");
              }
            }}
            className="mt-3 w-full text-center text-sm text-foreground"
          >
            Reenviar correo de confirmación
          </button>
        )}
      </div>
    </main>
  );
}
