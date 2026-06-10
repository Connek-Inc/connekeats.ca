"use client";
// Página de "nueva contraseña". El enlace del correo de recuperación apunta aquí
// (redirectTo en resetPassword). Supabase crea una sesión de recuperación al
// cargar; con ella, updateUser({password}) fija la clave nueva.

import { Spinner } from "@heroui/react";
import { UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

const inputCls =
  "mb-5 w-full rounded-2xl border border-foreground/10 bg-foreground/[0.05] px-5 py-3.5 text-foreground placeholder:text-foreground/35 outline-none transition focus:border-foreground/40 focus:ring-2 focus:ring-white/20";

export default function ResetPage() {
  const { initialized, session, updatePassword } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (password.length < 6) return show("La contraseña debe tener al menos 6 caracteres", "error");
    if (password !== confirm) return show("Las contraseñas no coinciden", "error");
    setLoading(true);
    try {
      await updatePassword(password);
      show("Contraseña actualizada", "success");
      router.replace("/home");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo actualizar la contraseña", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!initialized) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner color="accent" size="lg" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[28px] border border-foreground/10 bg-surface p-7 shadow-2xl sm:p-8">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
            <UtensilsCrossed className="size-5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Connek Restaurant</span>
        </div>

        <h1 className="mb-2 text-[28px] font-semibold leading-none text-foreground">Nueva contraseña</h1>

        {session ? (
          <>
            <p className="mb-6 text-sm text-foreground/50">Elige una contraseña nueva para tu cuenta.</p>
            <label className="mb-2 block text-[15px] font-medium text-foreground">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inputCls}
            />
            <label className="mb-2 block text-[15px] font-medium text-foreground">Repetir contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Repite la contraseña"
              className={inputCls}
            />
            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-full bg-foreground py-4 text-center text-[16px] font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
            >
              {loading ? "..." : "Guardar contraseña"}
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-sm text-foreground/50">
              Abre el enlace de restablecimiento desde tu correo para continuar. Puede haber expirado.
            </p>
            <button
              onClick={() => router.replace("/login")}
              className="w-full rounded-full border border-foreground/10 bg-foreground/[0.05] py-4 text-center text-[16px] text-foreground transition hover:bg-foreground/[0.1]"
            >
              Volver a iniciar sesión
            </button>
          </>
        )}
      </div>
    </main>
  );
}
