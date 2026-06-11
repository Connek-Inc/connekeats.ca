"use client";
// Primitivos de UI REUTILIZABLES. Antes se redefinían `Stat`/`Section`/`Row`/
// `Empty` en cada página (caja, fiscal, owner…); ahora viven aquí una sola vez.
// Convención: si un patrón visual se repite en ≥2 páginas, se extrae aquí.

import { Card } from "@heroui/react";
import type { ReactNode } from "react";

/** Tarjeta-estadística (valor grande + etiqueta). */
export function Stat({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-foreground/45">{label}</p>
    </div>
  );
}

/** Encabezado de sección (mayúsculas, tracking). */
export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`mb-2 text-xs uppercase tracking-wide text-foreground/50 ${className}`}>{children}</p>;
}

/** Tarjeta con el estilo `.glass` de la app. */
export function GlassCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return <Card className={`glass flex flex-col gap-1.5 rounded-2xl p-3 ${className}`}>{children}</Card>;
}

/** Sección = encabezado + tarjeta glass (patrón repetido en caja/fiscal). */
export function Section({ title, children, className = "" }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <GlassCard className={className}>{children}</GlassCard>
    </div>
  );
}

/** Fila izquierda/derecha (label + valor). */
export function ListRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/75">{left}</span>
      <span className="font-medium text-foreground">{right}</span>
    </div>
  );
}

/** Estado vacío. */
export function EmptyState({ children = "Sin datos." }: { children?: ReactNode }) {
  return <p className="text-sm text-foreground/40">{children}</p>;
}

/** Aviso/banner informativo (ámbar por defecto). */
export function InfoBanner({
  tone = "amber",
  icon,
  children,
  className = "",
}: {
  tone?: "amber" | "neutral";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    amber: "border-amber-500/30 bg-amber-500/10",
    neutral: "border-foreground/15 bg-foreground/5",
  };
  return (
    <Card className={`flex items-start gap-2 rounded-2xl border p-3 text-xs text-foreground/70 ${tones[tone]} ${className}`}>
      {icon}
      <span>{children}</span>
    </Card>
  );
}
