"use client";
// Botón para cambiar el tema (claro/oscuro) manualmente. Persiste vía next-themes.

import { Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground ${className}`}
    >
      {/* Evita mismatch de hidratación: ícono neutro hasta montar */}
      {mounted ? (
        isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />
      ) : (
        <SunMoon className="size-[18px]" />
      )}
    </button>
  );
}
