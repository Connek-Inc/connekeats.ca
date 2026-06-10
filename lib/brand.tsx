"use client";
// Motor de marca (white-label por negocio). Toma los colores/tipografía del
// negocio y los aplica como CSS custom properties INLINE en <html>, que ganan
// sobre cualquier regla de globals.css / HeroUI sin necesidad de !important.
// Reutilizable: brandVars() también sirve para el preview en vivo (en un <div>).

import type { CSSProperties } from "react";
import { useEffect } from "react";

export type BrandFields = {
  logo_url?: string | null;
  brand_primary?: string | null;
  brand_bg?: string | null;
  brand_fg?: string | null;
  brand_base?: string | null;
  brand_font?: string | null;
};

// Fuentes curadas. Las KEYS deben coincidir con las precargadas en layout.tsx
// (cada una define --font-<key>). 'oswald' = default (no override).
export const BRAND_FONTS = [
  { key: "oswald", label: "Oswald", sample: "var(--font-oswald)" },
  { key: "inter", label: "Inter", sample: "var(--font-inter)" },
  { key: "poppins", label: "Poppins", sample: "var(--font-poppins)" },
  { key: "montserrat", label: "Montserrat", sample: "var(--font-montserrat)" },
  { key: "playfair", label: "Playfair", sample: "var(--font-playfair)" },
] as const;

// Paletas curadas (punto de partida seguro). "" => sin marca (monocromo).
export const BRAND_PRESETS: { key: string; name: string; primary: string; bg: string; fg: string }[] = [
  { key: "mono", name: "Monocromo", primary: "", bg: "", fg: "" },
  { key: "esmeralda", name: "Esmeralda", primary: "#10b981", bg: "#0b1f17", fg: "#ecfdf5" },
  { key: "borgona", name: "Borgoña", primary: "#fb7185", bg: "#1a0b10", fg: "#fff1f2" },
  { key: "oceano", name: "Océano", primary: "#60a5fa", bg: "#0a1626", fg: "#eff6ff" },
  { key: "tierra", name: "Tierra", primary: "#f59e0b", bg: "#1c130a", fg: "#fffbeb" },
  { key: "crema", name: "Crema", primary: "#b45309", bg: "#fbf7f0", fg: "#1c1917" },
];

export function isHex(s?: string | null): s is string {
  return !!s && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

// Luminancia relativa WCAG de un hex (0 = negro, 1 = blanco).
export function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Contraste WCAG entre dos hex (1..21). Para avisar de baja legibilidad.
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Texto legible (negro/blanco) sobre un color.
function readableOn(hex: string): string {
  return luminance(hex) > 0.45 ? "#0a0a0a" : "#ffffff";
}

// Deriva TODAS las vars que leen HeroUI + globals.css a partir de los 3 colores.
// Devuelve {} si no hay marca → cae al tema monocromo (cero regresión).
export function brandVars(b?: BrandFields | null): Record<string, string> {
  if (!b) return {};
  const out: Record<string, string> = {};
  const primary = isHex(b.brand_primary) ? b.brand_primary : null;
  const bg = isHex(b.brand_bg) ? b.brand_bg : null;
  const fg = isHex(b.brand_fg) ? b.brand_fg : null;

  if (bg) out["--background"] = bg;
  if (fg) out["--foreground"] = fg;
  if (bg && fg) out["--surface"] = `color-mix(in oklab, ${fg} 5%, ${bg})`;

  if (primary) {
    const onP = readableOn(primary);
    out["--accent"] = primary;
    out["--accent-foreground"] = onP;
    out["--accent-hover"] = `color-mix(in oklab, ${primary} 84%, ${fg ?? "#000000"})`;
    out["--accent-soft"] = `color-mix(in oklab, ${primary} 16%, transparent)`;
    out["--accent-soft-hover"] = `color-mix(in oklab, ${primary} 26%, transparent)`;
    out["--accent-soft-foreground"] = primary;
    out["--focus"] = primary;
    out["--success"] = primary;
    out["--success-foreground"] = onP;
  }

  if (b.brand_font && b.brand_font !== "oswald") out["--font-sans"] = `var(--font-${b.brand_font})`;
  return out;
}

// brandVars como objeto style (para aplicar en un <div> de preview).
export function brandStyle(b?: BrandFields | null): CSSProperties {
  return brandVars(b) as CSSProperties;
}

// Monta esto donde haya un negocio activo (staff: AppShell; comensal: /t/[token]).
// Aplica las vars inline en <html> y limpia al desmontar/cambiar.
export function BrandStyle({ business }: { business?: BrandFields | null }) {
  const vars = brandVars(business);
  const json = JSON.stringify(vars);

  useEffect(() => {
    const el = document.documentElement;
    const map: Record<string, string> = JSON.parse(json);
    const keys = Object.keys(map);
    keys.forEach((k) => el.style.setProperty(k, map[k]));
    return () => {
      keys.forEach((k) => el.style.removeProperty(k));
    };
  }, [json]);

  return null;
}
