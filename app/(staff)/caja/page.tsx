"use client";

import { Button, Card, Input, Spinner } from "@heroui/react";
import { Banknote, CreditCard, Download, Landmark, Lock, type LucideIcon, Minus, Unlock } from "lucide-react";
import { useState } from "react";

import { useBusiness } from "@/lib/business";
import { API_URL } from "@/lib/config";
import { useCashCurrent, useCloseCash, useOpenCash, useSalesSummary } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const METHOD_META: Record<string, { icon: LucideIcon; label: string }> = {
  cash: { icon: Banknote, label: "Efectivo" },
  card: { icon: CreditCard, label: "Tarjeta" },
  transfer: { icon: Landmark, label: "Transferencia" },
  "sin método": { icon: Minus, label: "Sin método" },
};
const RANGES: [string, string][] = [
  ["today", "Hoy"],
  ["week", "Semana"],
  ["month", "Mes"],
];

export default function CajaPage() {
  const { businessId } = useBusiness();
  const { show } = useToast();
  const [range, setRange] = useState("today");
  const summary = useSalesSummary(businessId, range);
  const s = summary.data;

  async function exportCsv() {
    try {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
      const res = await fetch(`${API_URL}/businesses/${businessId}/reports/export?range=${range}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!res.ok) return show("No se pudo exportar", "error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ventas_${range}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      show("No se pudo exportar", "error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Caja &amp; Reportes</h1>
      </header>

      {/* ── Caja / turno ── */}
      {businessId && <CashBox businessId={businessId} />}

      {/* ── Ventas ── */}
      <div className="mt-8 mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Ventas</p>
        <div className="flex gap-1">
          {RANGES.map(([r, label]) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "primary" : "secondary"}
              className="rounded-full"
              onPress={() => setRange(r)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {summary.isLoading ? (
        <Spinner color="accent" />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Ventas" value={money(s?.revenue ?? 0)} />
            <Stat label="Pedidos" value={String(s?.count ?? 0)} />
            <Stat label="Ticket prom." value={money(s?.avg_ticket ?? 0)} />
          </div>

          <Section title="Por método de pago">
            {s && Object.keys(s.by_method).length ? (
              Object.entries(s.by_method).map(([m, v]) => {
                const meta = METHOD_META[m];
                return (
                  <Row
                    key={m}
                    left={
                      meta ? (
                        <span className="flex items-center gap-1.5">
                          <meta.icon className="size-4" /> {meta.label}
                        </span>
                      ) : (
                        m
                      )
                    }
                    right={money(v)}
                  />
                );
              })
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Top productos">
            {s?.top_products.length ? (
              s.top_products.map((p) => <Row key={p.name} left={p.name} right={`${p.qty}×`} />)
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Por mesero">
            {s?.by_waiter.length ? (
              s.by_waiter.map((w) => <Row key={w.waiter} left={w.waiter} right={money(w.total)} />)
            ) : (
              <Empty />
            )}
          </Section>

          <Button variant="secondary" onPress={exportCsv}>
            <span className="flex items-center justify-center gap-2">
              <Download className="size-4" /> Exportar CSV ({RANGES.find(([r]) => r === range)?.[1]})
            </span>
          </Button>
        </div>
      )}
    </main>
  );
}

function CashBox({ businessId }: { businessId: number }) {
  const current = useCashCurrent(businessId);
  const openCash = useOpenCash(businessId);
  const closeCash = useCloseCash(businessId);
  const { show } = useToast();
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [note, setNote] = useState("");

  const data = current.data;
  const session = data?.session ?? null;

  return (
    <section>
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Caja</p>
      <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
        {current.isLoading ? (
          <Spinner color="accent" size="sm" />
        ) : session ? (
          <>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Unlock className="size-4" /> Caja abierta
              </span>
              <span className="text-xs text-foreground/50">{new Date(session.opened_at).toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Inicial" value={money(session.opening_cash)} />
              <Stat label="Ventas efectivo" value={money(data?.cash_sales ?? 0)} />
              <Stat label="Esperado" value={money(data?.expected_cash ?? 0)} />
            </div>
            <Input
              type="number"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              placeholder="Efectivo contado al cerrar"
            />
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" />
            <Button
              variant="primary"
              isDisabled={closeCash.isPending}
              onPress={async () => {
                try {
                  const r = await closeCash.mutateAsync({ closing_cash: Number(closing) || 0, note: note || undefined });
                  const d = r.difference;
                  show(
                    `Caja cerrada. ${d === 0 ? "Cuadra" : d > 0 ? `Sobran ${money(d)}` : `Faltan ${money(Math.abs(d))}`}`,
                    d === 0 ? "success" : "info",
                  );
                  setClosing("");
                  setNote("");
                } catch (e) {
                  show(e instanceof Error ? e.message : "No se pudo cerrar", "error");
                }
              }}
            >
              {closeCash.isPending ? <Spinner color="current" size="sm" /> : "Cerrar caja (arqueo)"}
            </Button>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Lock className="size-4" /> Caja cerrada
            </span>
            <Input
              type="number"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="Efectivo inicial"
            />
            <Button
              variant="primary"
              isDisabled={openCash.isPending}
              onPress={async () => {
                try {
                  await openCash.mutateAsync(Number(opening) || 0);
                  setOpening("");
                  show("Caja abierta", "success");
                } catch (e) {
                  show(e instanceof Error ? e.message : "No se pudo abrir", "error");
                }
              }}
            >
              {openCash.isPending ? <Spinner color="current" size="sm" /> : "Abrir caja"}
            </Button>
          </>
        )}
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-foreground/45">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">{title}</p>
      <Card className="glass flex flex-col gap-1.5 rounded-2xl p-3">{children}</Card>
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/75">{left}</span>
      <span className="font-medium text-foreground">{right}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-foreground/40">Sin datos en este rango.</p>;
}
