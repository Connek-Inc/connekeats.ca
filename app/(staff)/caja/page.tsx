"use client";

import { Button, Card, Input, Spinner } from "@heroui/react";
import { ArrowLeft, Banknote, CreditCard, Download, FileText, HandCoins, Landmark, Lock, type LucideIcon, Minus, Plus, Receipt, RefreshCw, Trash2, TrendingDown, TrendingUp, Unlock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CobroPanel } from "@/components/CobroPanel";
import { OcrScanner } from "@/components/OcrScanner";
import { useBusiness } from "@/lib/business";
import { API_URL } from "@/lib/config";
import { useCashCurrent, useCloseCash, useCreateLedger, useDeleteLedger, useLedger, useOpenCash, useOrders, useOrderWithItems, usePaymentSummary, usePaymentTransactions, usePayrollReport, usePayouts, useSalesSummary, useSyncPayments, useTables, useTaxRemittance, useTimeseries } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";
import { tableColor } from "@/lib/tableColor";
import { EmptyState as Empty, ListRow as Row, Section, Stat } from "@/components/ui";
import { money } from "@/lib/format";

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
      <header className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Caja &amp; Reportes</h1>
        <Link
          href="/fiscal"
          className="flex shrink-0 items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs text-foreground/70 transition hover:text-foreground"
        >
          <FileText className="size-3.5" /> Facturación fiscal
        </Link>
      </header>

      {/* ── Caja / turno ── */}
      {businessId && <CashBox businessId={businessId} />}

      {/* ── POS: cobrar una mesa desde la caja ── */}
      {businessId && <CobrarMesa businessId={businessId} />}

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

      {/* ── Pagos con tarjeta (Square): historial detallado + conciliación ── */}
      {businessId && <SquarePayments businessId={businessId} />}

      {/* ── Contabilidad por periodo (hora/4h/día/semana/mes/año) ── */}
      {businessId && <Accounting businessId={businessId} />}

      {/* ── Ingresos / egresos manuales (libro contable) ── */}
      {businessId && <Ledger businessId={businessId} />}

      {/* ── Remesa fiscal (TPS/TVQ) + nómina (horas/propinas 8%) ── */}
      {businessId && <ComplianceReports businessId={businessId} />}
    </main>
  );
}

// Remesa de TPS/TVQ por período + datos de nómina (horas por empleado + regla de
// propinas 8% TP-1019.4). NO calcula retenciones (eso es del software de nómina/contador).
function ComplianceReports({ businessId }: { businessId: number }) {
  const [range, setRange] = useState("month");
  const remit = useTaxRemittance(businessId, range);
  const payroll = usePayrollReport(businessId);
  const r = remit.data;
  const p = payroll.data;
  return (
    <Section title="Remesa fiscal & nómina (datos)">
      <div className="mb-2 flex gap-1.5">
        {RANGES.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setRange(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${range === k ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground/60"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {r ? (
        <div className="flex flex-col gap-1">
          <Row left="Ventas (pre-impuesto)" right={money(r.sales_pretax)} />
          {r.components.map((c) => (
            <Row key={c.name} left={c.name} right={money(c.amount)} />
          ))}
          <Row left={<span className="font-bold">Impuesto a remesar</span>} right={<span className="font-bold">{money(r.tax_total)}</span>} />
          {r.platform_commission > 0 && <Row left="Comisión plataforma" right={money(r.platform_commission)} />}
        </div>
      ) : (
        <p className="text-sm text-foreground/40">Cargando…</p>
      )}

      <div className="mt-3 border-t border-foreground/10 pt-3">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-foreground/45">Propinas (regla 8% · TP-1019.4)</p>
        {p ? (
          <div className="flex flex-col gap-1">
            <Row left="Propinas declaradas" right={money(p.tips.declared_tips)} />
            <Row left="Piso 8% de ventas" right={money(p.tips.eight_percent_floor)} />
            <Row
              left="A atribuir (diferencia)"
              right={<span className={p.tips.attribution_gap > 0 ? "font-bold text-amber-600" : "text-foreground/60"}>{money(p.tips.attribution_gap)}</span>}
            />
            {p.hours_by_employee.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-foreground/45">Horas por empleado (turnos)</p>
                {p.hours_by_employee.map((h) => (
                  <Row key={h.employee_email} left={h.employee_email} right={`${h.hours} h`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-foreground/40">Sin turnos registrados.</p>
        )}
        <p className="mt-2 text-[11px] text-foreground/40">
          Las retenciones (TP-1019.4 / RRQ / RQAP / AE) y RL-1/T4 las calcula tu software de nómina o contador. Aquí solo se capturan datos.
        </p>
      </div>
    </Section>
  );
}

// Inicio del rango (ISO) para filtrar el historial de pagos por período.
function rangeBegin(range: string): string | undefined {
  const now = new Date();
  if (range === "week") return new Date(now.getTime() - 7 * 864e5).toISOString();
  if (range === "month") return new Date(now.getTime() - 30 * 864e5).toISOString();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  return undefined;
}

const POS_ACTIVE = ["open", "sent", "preparing", "ready", "served"];

// POS de Caja: cobrar una mesa desde la registradora (reusa CobroPanel del mesero).
function CobrarMesa({ businessId }: { businessId: number }) {
  const tables = useTables(businessId);
  const orders = useOrders(businessId);
  const [selected, setSelected] = useState<number | null>(null);

  const activeOrders = (orders.data ?? []).filter((o) => POS_ACTIVE.includes(o.status));
  const totalByTable = new Map<number, number>();
  activeOrders.forEach((o) => totalByTable.set(o.table_id, (totalByTable.get(o.table_id) ?? 0) + (Number(o.total) || 0)));
  const label = (id: number) => tables.data?.find((t) => t.id === id)?.label ?? `Mesa ${id}`;
  const chargeable = (tables.data ?? [])
    .filter((t) => totalByTable.has(t.id) || t.status === "bill_requested")
    .sort((a, b) => Number(b.status === "bill_requested") - Number(a.status === "bill_requested"));

  const activeOrder = activeOrders.find((o) => o.table_id === selected) ?? null;
  const otherTables = activeOrders
    .filter((o) => o.table_id !== selected)
    .map((o) => ({ id: o.table_id, label: label(o.table_id), total: Number(o.total) || 0 }));
  const detail = useOrderWithItems(businessId, activeOrder?.id ?? null);

  return (
    <section className="mt-8">
      <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/50">
        <HandCoins className="size-3.5" /> Cobrar mesa
      </p>
      {selected == null ? (
        chargeable.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {chargeable.map((t) => {
              const c = tableColor(t.id);
              const asked = t.status === "bill_requested";
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className="flex flex-col items-start gap-0.5 rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-3 text-left transition hover:bg-foreground/[0.08]"
                  style={{ borderLeftColor: c.hex, borderLeftWidth: 4 }}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    {t.label}
                    {asked && (
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        pide cuenta
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-foreground/60">{money(totalByTable.get(t.id) ?? 0)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-foreground/40">Sin mesas por cobrar.</p>
        )
      ) : (
        <Card className="glass rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Mesas
            </button>
            <p className="font-bold text-foreground">{label(selected)}</p>
          </div>
          <CobroPanel
            businessId={businessId}
            tableId={selected}
            orderTotal={activeOrder ? Number(activeOrder.total) || 0 : 0}
            items={detail.data?.items ?? []}
            otherTables={otherTables}
            onDone={() => setSelected(null)}
          />
        </Card>
      )}
    </section>
  );
}

function SquarePayments({ businessId }: { businessId: number }) {
  const { show } = useToast();
  const [range, setRange] = useState("month");
  // OJO: rangeBegin usa la hora actual → memoizar por `range`, si no la queryKey
  // cambia en cada render y dispara un refetch infinito (spinner perpetuo + storm).
  const begin = useMemo(() => rangeBegin(range), [range]);
  const summary = usePaymentSummary(businessId, begin);
  const txns = usePaymentTransactions(businessId, begin);
  const payouts = usePayouts(businessId);
  const sync = useSyncPayments(businessId);
  const sm = summary.data;

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Pagos con tarjeta (Square)</p>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full"
          isDisabled={sync.isPending}
          onPress={async () => {
            try {
              await sync.mutateAsync({ begin });
              show("Sincronizado con Square", "success");
            } catch (e) {
              show(e instanceof Error ? e.message : "No se pudo sincronizar", "error");
            }
          }}
        >
          <span className="flex items-center gap-1.5">
            {sync.isPending ? <Spinner color="current" size="sm" /> : <RefreshCw className="size-3.5" />} Sincronizar
          </span>
        </Button>
      </div>
      <div className="mb-2 flex gap-1">
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

      <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <Stat label="Facturado" value={money(sm?.gross ?? 0)} />
          <Stat label="Comis. Square" value={money(sm?.processing_fee ?? 0)} />
          <Stat label="Comis. Connek" value={money(sm?.app_fee ?? 0)} />
          <Stat label="Neto" value={money(sm?.net ?? 0)} />
        </div>

        <div className="flex flex-col gap-1 border-t border-foreground/10 pt-2">
          <p className="text-[10px] uppercase tracking-wide text-foreground/40">Transacciones</p>
          {txns.isLoading ? (
            <Spinner color="accent" size="sm" />
          ) : txns.data?.length ? (
            txns.data.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 text-foreground/75">
                  <CreditCard className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {(t.card_brand ?? "Tarjeta")} ····{t.card_last4 ?? "----"}
                  </span>
                  <span className="shrink-0 text-foreground/35">
                    {t.paid_at ? new Date(t.paid_at).toLocaleDateString() : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-foreground/50">{money(t.gross)}</span>
                  <span className="text-foreground/35">−{money((t.processing_fee || 0) + (t.app_fee || 0))}</span>
                  <span className="font-medium text-foreground">{money(t.net)}</span>
                  {t.receipt_url && (
                    <a href={t.receipt_url} target="_blank" rel="noreferrer" aria-label="Ver recibo">
                      <Receipt className="size-3.5 text-foreground/40 transition hover:text-foreground/70" />
                    </a>
                  )}
                </span>
              </div>
            ))
          ) : (
            <Empty />
          )}
        </div>

        {payouts.data?.length ? (
          <div className="flex flex-col gap-1 border-t border-foreground/10 pt-2">
            <p className="text-[10px] uppercase tracking-wide text-foreground/40">Depósitos al banco</p>
            {payouts.data.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-foreground/75">
                  <Landmark className="size-3.5" />
                  {p.arrival_date ?? "—"}
                  {p.destination_last4 ? <span className="text-foreground/40">····{p.destination_last4}</span> : null}
                </span>
                <span className="font-medium text-foreground">
                  {money(p.amount)} <span className="text-[10px] text-foreground/40">{p.status}</span>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
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

// Stat / Section / Row / Empty se reutilizan desde @/components/ui
