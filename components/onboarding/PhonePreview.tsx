"use client";
// Preview EN VIVO de lo que verá el comensal al escanear el QR. Es puro reflejo
// del estado del wizard (no llama al backend). Reusa el look de /t/[token].

import { Eye } from "lucide-react";

import { presetFor, type ModeKey } from "@/lib/modePresets";
import type { DraftCategory } from "./state";

export function PhonePreview({
  mode,
  menu,
  tableLabel,
}: {
  mode: ModeKey;
  menu: DraftCategory[];
  tableLabel: string;
}) {
  const preset = presetFor(mode);
  const items = menu.flatMap((c) => c.items.filter((it) => it.included && it.name.trim()));

  return (
    <div className="w-[300px] shrink-0">
      <div className="relative rounded-[2.5rem] border-[10px] border-[#1c1c1c] bg-background shadow-2xl">
        {/* notch */}
        <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-foreground/15" />
        <div
          className="h-[560px] overflow-y-auto rounded-[2rem] px-4 pb-6 pt-9"
          style={{
            backgroundImage:
              "radial-gradient(30rem 20rem at 110% -10%, rgba(255,255,255,0.06), transparent 60%)",
          }}
        >
          <header className="mb-4">
            <p className="flex items-center gap-1.5 text-sm text-foreground/60">
              <preset.Icon className="size-4" /> {preset.label}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{tableLabel}</h2>
          </header>

          {/* Quick actions del modo */}
          <div className="mb-4 flex flex-wrap gap-2">
            {preset.quickActions.map((qa) => (
              <span
                key={qa.id}
                className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.06] px-3 py-1.5 text-xs text-foreground/85"
              >
                <qa.icon className="size-3.5" />
                {qa.label}
              </span>
            ))}
          </div>

          <p className="mb-2 text-[10px] uppercase tracking-wide text-foreground/50">{preset.terms.menu}</p>
          <div className="flex flex-col gap-2">
            {items.length ? (
              items.map((it, i) => (
                <div
                  key={`${it.name}-${i}`}
                  className="glass flex items-center justify-between rounded-2xl p-3"
                >
                  <span className="text-sm text-foreground">{it.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground/70">${(Number(it.price) || 0).toFixed(2)}</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-sm text-background">
                      +
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/40">Tu {preset.terms.menu} aparecerá aquí.</p>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-foreground/40">
        <Eye className="size-3.5" /> Lo que verá tu cliente al escanear
      </p>
    </div>
  );
}
