"use client";
// Selector de idioma ES / EN / FR (segmentado). Lee/escribe el locale global.
import { LOCALES, useLocale } from "@/lib/i18n";

export function LangSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-foreground/15 bg-foreground/[0.04] p-0.5"
      role="group"
      aria-label="Idioma / Language / Langue"
    >
      {LOCALES.map((l) => (
        <button
          key={l.key}
          type="button"
          onClick={() => setLocale(l.key)}
          aria-pressed={locale === l.key}
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
            locale === l.key ? "bg-foreground text-background" : "text-foreground/55 hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
