"use client";
// Aviso de privacidad (primera visita). Loi 25: transparencia + privacidad por
// defecto. Solo usamos almacenamiento esencial (idioma/tema/sesión), sin rastreo,
// así que es un AVISO con enlace a la política, no un muro de cookies.

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@/lib/i18n";
import { PRIVACY } from "@/lib/privacyPolicy";

const KEY = "connek_privacy_ack";

export function ConsentBanner() {
  const { locale } = useLocale();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="safe-pb fixed inset-x-0 bottom-0 z-[70] p-3">
      <div className="glass-strong mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-foreground/75">
          {PRIVACY.banner[locale]}{" "}
          <Link href="/privacy" className="font-semibold text-foreground underline">
            {PRIVACY.link[locale]}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-foreground px-4 py-1.5 text-xs font-bold text-background transition active:scale-95"
        >
          {PRIVACY.accept[locale]}
        </button>
      </div>
    </div>
  );
}
