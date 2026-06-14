"use client";
// Carta imprimible / accesible (alternativa NO-QR): menú estático, semántico y
// de alto contraste que el restaurante puede imprimir/entregar y que un lector
// de pantalla lee bien. Cumple el "deber de acomodar" (Carta de QC) ofreciendo
// una vía no dependiente del smartphone. Reusa la sesión + menú del comensal.

import { ArrowLeft, Printer, Wine } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import type { DinerSession, MenuCategory, MenuItem } from "@/lib/types";

export default function PrintMenuPage() {
  const { token: qrToken } = useParams<{ token: string }>();
  const t = useT();
  const [session, setSession] = useState<DinerSession | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cats, setCats] = useState<MenuCategory[]>([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const s = await api.post<DinerSession>("/diner/session", { qr_token: qrToken });
        if (!ok) return;
        setSession(s);
        const m = await api.get<{ items: MenuItem[]; categories: MenuCategory[] }>("/diner/menu", s.token);
        if (!ok) return;
        setItems(m.items ?? []);
        setCats(m.categories ?? []);
      } catch {
        if (ok) setErr(true);
      }
    })();
    return () => {
      ok = false;
    };
  }, [qrToken]);

  if (err) {
    return <main className="mx-auto max-w-2xl p-10 text-center text-black">QR inválido.</main>;
  }

  const groups = cats
    .map((c) => ({ name: c.name, list: items.filter((i) => i.category_id === c.id) }))
    .filter((g) => g.list.length > 0);
  const uncategorized = items.filter((i) => !i.category_id || !cats.some((c) => c.id === i.category_id));

  const Row = ({ it }: { it: MenuItem }) => (
    <li className="flex items-baseline justify-between gap-3 border-b border-black/10 py-2">
      <span>
        <span className="font-semibold">{it.name}</span>
        {it.is_alcohol ? (
          <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-[11px] font-bold text-black/60">
            <Wine className="size-3" aria-hidden /> 18+
          </span>
        ) : null}
        {it.description ? <span className="block text-sm text-black/60">{it.description}</span> : null}
      </span>
      <span className="shrink-0 font-mono font-semibold tabular-nums">${Number(it.price).toFixed(2)}</span>
    </li>
  );

  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white px-6 py-8 text-black">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/t/${qrToken}`} className="flex items-center gap-1 text-sm text-black/60 transition hover:text-black">
          <ArrowLeft className="size-4" aria-hidden /> Connek Food
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          <Printer className="size-4" aria-hidden /> {t("diner.printMenu")}
        </button>
      </div>

      {session?.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={session.logo_url} alt="" className="mb-3 h-12 w-auto object-contain" />
      ) : null}
      <h1 className="text-3xl font-black tracking-tight">Menú · Menu · Carte</h1>
      {session?.table_label ? <p className="mt-1 text-sm text-black/50">{session.table_label}</p> : null}

      <div className="mt-6 flex flex-col gap-7">
        {groups.map((g) => (
          <section key={g.name}>
            <h2 className="mb-1 border-b-2 border-black pb-1 text-lg font-bold uppercase tracking-wide">{g.name}</h2>
            <ul>
              {g.list.map((it) => (
                <Row key={it.id} it={it} />
              ))}
            </ul>
          </section>
        ))}
        {uncategorized.length > 0 && (
          <section>
            {groups.length > 0 && (
              <h2 className="mb-1 border-b-2 border-black pb-1 text-lg font-bold uppercase tracking-wide">{t("diner.all")}</h2>
            )}
            <ul>
              {uncategorized.map((it) => (
                <Row key={it.id} it={it} />
              ))}
            </ul>
          </section>
        )}
        {items.length === 0 && !err && <p className="text-black/50">{t("diner.noItems")}</p>}
      </div>

      <p className="mt-10 text-center text-[11px] text-black/40">connekeats.ca</p>
    </main>
  );
}
