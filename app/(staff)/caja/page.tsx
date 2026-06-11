"use client";

import { Button, Card, Input, Spinner } from "@heroui/react";
import { Banknote, CreditCard, Download, Landmark, Lock, type LucideIcon, Minus, Plus, Trash2, TrendingDown, TrendingUp, Unlock } from "lucide-react";
import { useState } from "react";

import { OcrScanner } from "@/components/OcrScanner";
import { useBusiness } from "@/lib/business";
import { API_URL } from "@/lib/config";
import { useCashCurrent, useCloseCash, useCreateLedger, useDeleteLedger, useLedger, useOpenCash, useSalesSummary, useTimeseries } from "@/lib/hooks";
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

      {/* ── OCR: escanear facturas de proveedor ── */}
      {businessId && (
        <div className="mt-4">
          <OcrScanner businessId={businessId} />
        </div>
      )}

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

      {/* ── Contabilidad por periodo (hora/4h/día/semana/mes/año) ── */}
      {businessId && <Accounting businessId={businessId} />}

      {/* ── Ingresos / egresos manuales (libro contable) ── */}
      {businessId && <Ledger businessId={businessId} />}
    </main>
  );
}

const GRANS: [string, string][] = [
  ["hour", "Hora"],
  ["4h", "4 horas"],
  ["day", "Día"],
  ["week", "Semana"],
  ["month", "Mes"],
  ["year", "Año"],
];

function Accounting({ businessId }: { businessId: number }) {
  const [gran, setGran] = useState("day");
  const ts = useTimeseries(businessId, gran);
  const d = ts.data;
  return (
    <section className="mt-8">
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Contabilidad por periodo</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {GRANS.map(([g, label]) => (
          <Button
            key={g}
            size="sm"
            variant={gran === g ? "primary" : "secondary"}
            className="rounded-full"
            onPress={() => setGran(g)}
          >
            {label}
          </Button>
        ))}
      </div>
      {ts.isLoading ? (
        <Spinner color="accent" />
      ) : (
        <Card className="glass flex flex-col gap-2 rounded-3xl p-4">
          {d?.totals && (
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <Stat label="Ventas" value={money(d.totals.sales)} />
              <Stat label="Ingresos" value={money(d.totals.income)} />
              <Stat label="Egresos" value={money(d.totals.expense)} />
              <Stat label="Neto" value={money(d.totals.net)} />
            </div>
          )}
          <div className="flex flex-col gap-1 border-t border-foreground/10 pt-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-foreground/40">
              <span>Periodo</span>
              <span className="flex gap-3">
                <span className="w-16 text-right">Ventas</span>
                <span className="w-16 text-right">Neto</span>
              </span>
            </div>
            {d?.buckets.length ? (
              [...d.buckets].reverse().map((b) => (
                <div key={b.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/75">{b.key}</span>
                  <span className="flex gap-3">
                    <span className="w-16 text-right text-foreground/70">{money(b.sales)}</span>
                    <span className={`w-16 text-right font-medium ${b.net >= 0 ? "text-foreground" : "text-rose-500"}`}>
                      {money(b.net)}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </div>
        </Card>
      )}
    </section>
  );
}

function Ledger({ businessId }: { businessId: number }) {
  const ledger = useLedger(businessId);
  const create = useCreateLedger(businessId);
  const del = useDeleteLedger(businessId);
  const { show } = useToast();
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const add = () => {
    const a = Number(amount);
    if (!a || a <= 0) return show("Monto inválido", "error");
    create.mutate(
      { kind, amount: a, category: category || undefined, note: note || undefined },
      {
        onSuccess: () => {
          setAmount("");
          setCategory("");
          setNote("");
          show("Movimiento registrado", "success");
        },
        onError: () => show("No se pudo registrar", "error"),
      },
    );
  };

  return (
    <section className="mt-8">
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Ingresos / egresos manuales</p>
      <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
        <div className="flex gap-2">
          <Button size="sm" variant={kind === "income" ? "primary" : "secondary"} className="flex-1 rounded-full" onPress={() => setKind("income")}>
            <span className="flex items-center justify-center gap-1">
              <TrendingUp className="size-4" /> Ingreso
            </span>
          </Button>
          <Button size="sm" variant={kind === "expense" ? "primary" : "secondary"} className="flex-1 rounded-full" onPress={() => setKind("expense")}>
            <span className="flex items-center justify-center gap-1">
              <TrendingDown className="size-4" /> Egreso
            </span>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Monto" />
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoría (ej. Proveedor)" />
        </div>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" />
        <Button variant="primary" isDisabled={create.isPending} onPress={add}>
          <span className="flex items-center justify-center gap-2">
            <Plus className="size-4" /> Registrar {kind === "income" ? "ingreso" : "egreso"}
          </span>
        </Button>
        {ledger.data?.length ? (
          <div className="flex flex-col gap-1 border-t border-foreground/10 pt-2">
            {ledger.data.slice(0, 15).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-foreground/75">
                  {e.kind === "income" ? (
                    <TrendingUp className="size-3.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-3.5 text-rose-500" />
                  )}
                  {e.category || (e.kind === "income" ? "Ingreso" : "Egreso")}
                  {e.note ? <span className="text-foreground/40">· {e.note}</span> : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`font-medium ${e.kind === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                    {e.kind === "income" ? "+" : "−"}
                    {money(e.amount)}
                  </span>
                  <button onClick={() => del.mutate(e.id)} aria-label="Eliminar movimiento">
                    <Trash2 className="size-3.5 text-foreground/30 transition hover:text-foreground/60" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
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
