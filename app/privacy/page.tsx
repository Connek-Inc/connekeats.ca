"use client";
// Política de privacidad pública (PIPEDA + Loi 25). Trilingüe: usa el locale global.
// Ruta pública (sin login), accesible desde el banner de consentimiento y el footer.

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LangSwitcher } from "@/components/LangSwitcher";
import { useLocale } from "@/lib/i18n";
import { PRIVACY } from "@/lib/privacyPolicy";

function Body({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      out.push(
        <ul key={`u${k}`} className="my-2 ml-5 list-disc space-y-1 text-foreground/70">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith("- ")) {
      bullets.push(l.slice(2));
      return;
    }
    flush(i);
    if (l) out.push(<p key={`p${i}`} className="my-2 leading-relaxed text-foreground/70">{l}</p>);
  });
  flush(9999);
  return <>{out}</>;
}

export default function PrivacyPage() {
  const { locale } = useLocale();
  const L = locale;
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-sm text-foreground/60 transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Connek Food
        </Link>
        <LangSwitcher />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground">{PRIVACY.pageTitle[L]}</h1>
      <p className="mb-6 mt-1 text-xs text-foreground/40">v. {PRIVACY.updated}</p>

      <div className="mb-8">
        <Body text={PRIVACY.intro[L]} />
      </div>

      {PRIVACY.sections.map((s) => (
        <section key={s.key} className="mb-7">
          <h2 className="mb-1 text-lg font-semibold text-foreground">{s.title[L]}</h2>
          <Body text={s.body[L]} />
        </section>
      ))}
    </main>
  );
}
