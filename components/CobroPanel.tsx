"use client";
// Panel de cobro del mesero con 3 modos:
//   • Toda la mesa  → descuento + propina + cobro completo (checkout)
//   • Dividir       → pagos parciales: partes iguales (entre N) o por ítem
//   • Varias mesas  → un cliente paga varias mesas de una (checkout-multi)
import { Button, Card, Spinner } from "@heroui/react";
import { Banknote, CheckCircle2, CreditCard, FileText, Landmark, type LucideIcon, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SquareCardForm } from "@/components/SquareCardForm";
import { useAckRequest, useAddPayment, useBillDetail, useBusinesses, useChargeCard, useCheckoutMulti, useCheckoutTable, useOpenBill, usePaymentConfig, useServiceRequests } from "@/lib/hooks";
import { tableColor } from "@/lib/tableColor";
import { useToast } from "@/lib/toast";

type OItem = { id: number; qty: number; name_snapshot: string; price_snapshot: number };
type OtherTable = { id: number; label: string; total: number };

const PAY: [string, LucideIcon, string][] = [
  ["cash", Banknote, "Efectivo"],
  ["card", CreditCard, "Tarjeta"],
  ["transfer", Landmark, "Transferencia"],
];

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

function Pay({ onPay, pending, label = "Cobrar con" }: { onPay: (m: string) => void; pending?: boolean; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-foreground/45">{label}</span>
      <div className="flex gap-1.5">
        {PAY.map(([m, Icon, lbl]) => (
          <Button key={m} size="sm" variant="secondary" className="flex-1 rounded-xl" isDisabled={pending} onPress={() => onPay(m)}>
            <span className="flex items-center justify-center gap-1.5">
              <Icon className="size-4" /> {lbl}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}

export function CobroPanel({
  businessId,
  tableId,
  orderTotal,
  items,
  otherTables,
  onDone,
}: {
  businessId: number;
  tableId: number;
  orderTotal: number;
  items: OItem[];
  otherTables: OtherTable[];
  onDone: () => void;
}) {
  const { show } = useToast();
  const router = useRouter();
  const [mode, setMode] = useState<"full" | "split" | "multi">("full");
  // Tras confirmar el pago → estado "pagado" con botón manual "Emitir factura".
  const [paid, setPaid] = useState<{ billId: number | null; total: number; receiptUrl?: string | null } | null>(null);

  const checkout = useCheckoutTable(businessId);
  const openBill = useOpenBill(businessId);
  const addPayment = useAddPayment(businessId);
  const checkoutMulti = useCheckoutMulti(businessId);
  const charge = useChargeCard(businessId);
  // Avisos "pide la cuenta": al cobrar la mesa los marcamos hechos (handoff limpio).
  const requests = useServiceRequests(businessId);
  const ackReq = useAckRequest(businessId);
  // Config de cobro con tarjeta por negocio (entorno sandbox/demo vs producción).
  const payCfg = usePaymentConfig(businessId);
  const sqEnabled = Boolean(payCfg.data?.enabled);
  const isDemo = payCfg.data?.environment === "sandbox";
  // Cobro real con tarjeta (Square): cuenta abierta + monto a cobrar.
  const [sq, setSq] = useState<{ billId: number; amount: number } | null>(null);

  // Al confirmarse el pago de la mesa → cerrar el aviso "pide la cuenta" (si lo hubo)
  // y MOSTRAR la factura automáticamente (si la cuenta tiene id).
  useEffect(() => {
    if (!paid) return;
    (requests.data ?? [])
      .filter((r) => r.table_id === tableId && r.type === "request_bill" && r.status !== "done")
      .forEach((r) => ackReq.mutate({ id: r.id, action: "done" }));
    // Factura imprimible: si el pago fue con tarjeta, el recibo lo genera SQUARE
    // (su receipt_url). Si no hay recibo Square (efectivo/transferencia), cae a la
    // factura propia. La factura fiscal QC se genera igual en segundo plano.
    if (paid.receiptUrl) window.location.href = paid.receiptUrl;
    else if (paid.billId) router.push(`/factura/${paid.billId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  // ── Toda la mesa: descuento + frais de service + propina + impuesto ──
  const [discount, setDiscount] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [tip, setTip] = useState("");
  const businesses = useBusinesses();
  const biz = businesses.data?.find((b) => b.id === businessId);
  const taxComps = biz?.tax_components ?? [];
  const addsTax = taxComps.length > 0 && !biz?.prices_include_tax;
  const round2 = (n: number) => Math.round((n + 1e-9) * 100) / 100; // half-up (paridad con Decimal del backend)
  const taxRateSum = taxComps.reduce((s, c) => s + Number(c.rate), 0);
  const grossFactor = addsTax ? 1 + taxRateSum / 100 : 1; // para gross-up de "por ítem" / "varias mesas"
  // El frais de service es gravable → entra a la base; la propina NO se grava.
  const baseAfterDisc = Math.max(0, orderTotal - (Number(discount) || 0)) + (Number(serviceCharge) || 0);
  const taxLines = addsTax
    ? taxComps.map((c) => ({ name: c.name, rate: c.rate, amount: round2((baseAfterDisc * Number(c.rate)) / 100) }))
    : [];
  const taxTotal = round2(taxLines.reduce((s, l) => s + l.amount, 0));
  const fullTotal = round2(baseAfterDisc + taxTotal + (Number(tip) || 0));
  async function cobrarFull(method: string) {
    // Tarjeta + Square activo → cobro REAL (abre el formulario de tarjeta).
    if (method === "card" && sqEnabled) {
      return startCardCharge();
    }
    try {
      const r = await checkout.mutateAsync({ tableId, paymentMethod: method, discount: Number(discount) || 0, tip: Number(tip) || 0, serviceCharge: Number(serviceCharge) || 0 });
      show(`Mesa cobrada · ${money(fullTotal)}`, "success");
      setPaid({ billId: r?.bill_id ?? null, total: fullTotal });
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo cobrar", "error");
    }
  }

  // Abre/asegura la cuenta para obtener un bill_id y muestra el formulario Square.
  // (El cobro con tarjeta v1 cobra el TOTAL de la cuenta + propina; el descuento
  //  del panel aún no aplica a tarjeta.)
  async function startCardCharge() {
    try {
      const d = await openBill.mutateAsync(tableId);
      // Monto a cobrar: el remaining del bill (ya sincronizado con la orden viva);
      // si por alguna razón viene en 0, cae al total del bill y luego a la orden.
      const amt = Number(d.remaining) || Number(d.bill?.total) || Number(orderTotal) || 0;
      setSq({ billId: d.bill.id, amount: amt });
    } catch {
      show("No se pudo abrir la cuenta", "error");
    }
  }

  async function onCardToken(sourceId: string) {
    if (!sq) return;
    const t = Number(tip) || 0;
    try {
      const r = await charge.mutateAsync({ billId: sq.billId, amount: sq.amount, sourceId, tip: t, idempotencyKey: crypto.randomUUID() });
      if (r.ok) {
        show(`Mesa cobrada con tarjeta · ${money(sq.amount + t)}`, "success");
        setSq(null);
        setPaid({ billId: sq.billId, total: sq.amount + t, receiptUrl: r.receipt_url ?? null });
      } else {
        show(r.error ?? "Pago rechazado", "error");
      }
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo cobrar", "error");
    }
  }

  // ── Dividir: abre la cuenta y registra pagos parciales ──
  const [billId, setBillId] = useState<number | null>(null);
  const detail = useBillDetail(businessId, billId);
  const [splitMode, setSplitMode] = useState<"equal" | "item">("equal");
  const [parts, setParts] = useState("2");
  const [sel, setSel] = useState<Set<number>>(new Set());

  const total = Number(detail.data?.bill.total) || orderTotal;
  const remaining = detail.data ? detail.data.remaining : total;
  const nParts = Math.max(1, Math.floor(Number(parts) || 1));
  const perPart = Math.min(remaining, Math.round((total / nParts) * 100) / 100);
  const selSum = items.filter((it) => sel.has(it.id)).reduce((s, it) => s + it.price_snapshot * it.qty, 0);
  const selGross = round2(selSum * grossFactor); // con impuesto, para que los pagos por ítem salden la cuenta

  function startSplit() {
    openBill.mutate(tableId, {
      onSuccess: (d) => setBillId(d.bill.id),
      onError: () => show("No se pudo abrir la cuenta", "error"),
    });
  }
  async function pay(amount: number, method: string, note: string) {
    if (!billId || amount <= 0) return;
    try {
      const r = await addPayment.mutateAsync({ billId, amount: Math.round(amount * 100) / 100, method, note });
      setSel(new Set());
      if (r.done) {
        show("Cuenta saldada ✓", "success");
        setPaid({ billId, total });
      } else {
        show(`Pago de ${money(amount)} · faltan ${money(r.remaining)}`, "success");
      }
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo registrar el pago", "error");
    }
  }

  // ── Varias mesas ──
  const [selTables, setSelTables] = useState<Set<number>>(new Set());
  const multiTotal = round2(
    (orderTotal + otherTables.filter((t) => selTables.has(t.id)).reduce((s, t) => s + t.total, 0)) * grossFactor,
  );
  async function cobrarMulti(method: string) {
    try {
      const r = await checkoutMulti.mutateAsync({ tableIds: [tableId, ...selTables], paymentMethod: method });
      show(`${r.bill_ids.length} mesas cobradas · ${money(r.total)}`, "success");
      onDone();
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo cobrar", "error");
    }
  }

  // ── Pago confirmado → emitir factura (manual) ──
  if (paid) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-foreground/[0.05] p-5 text-center">
        <CheckCircle2 className="size-10 text-foreground" />
        <p className="text-lg font-bold text-foreground">Pago confirmado · {money(paid.total)}</p>
        <p className="text-sm text-foreground/55">¿Emitir la factura de esta mesa?</p>
        <div className="flex w-full gap-2">
          <Button
            variant="primary"
            className="flex-1"
            isDisabled={!paid.billId}
            onPress={() => paid.billId && router.push(`/factura/${paid.billId}`)}
          >
            <span className="flex items-center justify-center gap-1.5">
              <FileText className="size-4" /> Emitir factura
            </span>
          </Button>
          <Button variant="secondary" onPress={onDone}>
            Listo
          </Button>
        </div>
      </div>
    );
  }

  const TabBtn = ({ k, label }: { k: typeof mode; label: string }) => (
    <button
      type="button"
      onClick={() => setMode(k)}
      className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        mode === k ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground/60"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      {isDemo && (
        <div className="rounded-xl bg-amber-500/15 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-amber-600">
          Modo demo · pagos de prueba (dinero falso)
        </div>
      )}
      <div className="flex gap-1.5">
        <TabBtn k="full" label="Toda la mesa" />
        <TabBtn k="split" label="Dividir" />
        <TabBtn k="multi" label="Varias mesas" />
      </div>

      {/* ── TODA LA MESA ── */}
      {mode === "full" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-2xl bg-foreground/[0.05] p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/60">Subtotal</span>
              <span className="text-foreground">{money(orderTotal)}</span>
            </div>
            <label className="flex items-center justify-between gap-2">
              <span className="text-foreground/60">Descuento</span>
              <span className="flex items-center gap-1">
                {[10, 15].map((p) => (
                  <button key={p} type="button" onClick={() => setDiscount(((orderTotal * p) / 100).toFixed(2))} className="rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-foreground/60">
                    {p}%
                  </button>
                ))}
                <input type="number" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="w-20 rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-right text-foreground outline-none" />
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-foreground/60">Servicio <span className="text-foreground/35">(frais)</span></span>
              <span className="flex items-center gap-1">
                {[10, 15].map((p) => (
                  <button key={p} type="button" onClick={() => setServiceCharge(((orderTotal * p) / 100).toFixed(2))} className="rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-foreground/60">
                    {p}%
                  </button>
                ))}
                <input type="number" inputMode="decimal" value={serviceCharge} onChange={(e) => setServiceCharge(e.target.value)} placeholder="0" className="w-20 rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-right text-foreground outline-none" />
              </span>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-foreground/60">Propina</span>
              <span className="flex items-center gap-1">
                {[10, 15, 20].map((p) => (
                  <button key={p} type="button" onClick={() => setTip(((orderTotal * p) / 100).toFixed(2))} className="rounded-full border border-foreground/15 px-2 py-0.5 text-[11px] text-foreground/60">
                    {p}%
                  </button>
                ))}
                <input type="number" inputMode="decimal" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" className="w-20 rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-right text-foreground outline-none" />
              </span>
            </label>
            {taxLines.map((l, i) => (
              <div key={i} className="flex justify-between text-foreground/60">
                <span>{l.name} ({Number(l.rate)}%)</span>
                <span className="text-foreground/80">{money(l.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-foreground/10 pt-2 font-bold text-foreground">
              <span>Total</span>
              <span>{money(fullTotal)}</span>
            </div>
          </div>
          {sq && payCfg.data ? (
            <SquareCardForm
              amountLabel={money(sq.amount + (Number(tip) || 0))}
              submitting={charge.isPending}
              onToken={onCardToken}
              onCancel={() => setSq(null)}
              appId={payCfg.data.application_id}
              locationId={payCfg.data.location_id}
              environment={payCfg.data.environment}
            />
          ) : (
            <Pay pending={checkout.isPending || openBill.isPending} onPay={cobrarFull} />
          )}
        </div>
      )}

      {/* ── DIVIDIR ── */}
      {mode === "split" && (
        <div className="flex flex-col gap-3">
          {!billId ? (
            <Button variant="primary" fullWidth isDisabled={openBill.isPending} onPress={startSplit}>
              {openBill.isPending ? <Spinner color="current" size="sm" /> : `Dividir cuenta (${money(orderTotal)})`}
            </Button>
          ) : (
            <>
              <div className="flex justify-between rounded-2xl bg-foreground/[0.05] p-3 text-sm">
                <span className="text-foreground/60">Total {money(total)} · Pagado {money(detail.data?.paid ?? 0)}</span>
                <span className="font-bold text-foreground">Faltan {money(remaining)}</span>
              </div>
              <button type="button" onClick={() => router.push(`/factura/${billId}`)} className="flex items-center justify-center gap-1.5 text-xs text-foreground/55 transition hover:text-foreground">
                <FileText className="size-3.5" /> Ver factura
              </button>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setSplitMode("equal")} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${splitMode === "equal" ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground/60"}`}>
                  Partes iguales
                </button>
                <button type="button" onClick={() => setSplitMode("item")} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${splitMode === "item" ? "bg-foreground text-background" : "bg-foreground/[0.06] text-foreground/60"}`}>
                  Por ítem
                </button>
              </div>

              {splitMode === "equal" ? (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">Dividir entre</span>
                    <input type="number" inputMode="numeric" min={1} value={parts} onChange={(e) => setParts(e.target.value)} className="w-16 rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-right text-foreground outline-none" />
                  </label>
                  <p className="text-center text-sm text-foreground/60">Cada parte: <span className="font-bold text-foreground">{money(perPart)}</span></p>
                  <Pay pending={addPayment.isPending} label={`Cobrar 1 parte (${money(perPart)})`} onPay={(m) => pay(perPart, m, `Parte de ${nParts}`)} />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
                    {items.map((it) => {
                      const on = sel.has(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() =>
                            setSel((p) => {
                              const n = new Set(p);
                              if (n.has(it.id)) n.delete(it.id);
                              else n.add(it.id);
                              return n;
                            })
                          }
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${on ? "border-foreground bg-foreground/10" : "border-foreground/10"}`}
                        >
                          <span className="text-foreground/80">
                            {on ? "✓ " : ""}{it.qty}× {it.name_snapshot}
                          </span>
                          <span className="text-foreground">{money(it.price_snapshot * it.qty)}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selSum > 0 && (
                    <Pay
                      pending={addPayment.isPending}
                      label={`Cobrar selección (${money(selGross)})`}
                      onPay={(m) => pay(selGross, m, items.filter((it) => sel.has(it.id)).map((it) => it.name_snapshot).join(", "))}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── VARIAS MESAS ── */}
      {mode === "multi" && (
        <div className="flex flex-col gap-3">
          {otherTables.length === 0 ? (
            <p className="text-sm text-foreground/40">No hay otras mesas con cuenta abierta.</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-foreground/45">Combinar con (esta mesa + …)</p>
              <div className="flex flex-col gap-1">
                {otherTables.map((t) => {
                  const on = selTables.has(t.id);
                  const c = tableColor(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setSelTables((p) => {
                          const n = new Set(p);
                          if (n.has(t.id)) n.delete(t.id);
                          else n.add(t.id);
                          return n;
                        })
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${on ? "border-foreground bg-foreground/10" : "border-foreground/10"}`}
                    >
                      <span className="flex items-center gap-2 text-foreground/80">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                        {on ? "✓ " : ""}{t.label}
                      </span>
                      <span className="text-foreground">{money(t.total)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-foreground/[0.05] p-3 text-sm">
                <span className="flex items-center gap-1.5 text-foreground/60">
                  <Users className="size-4" /> {1 + selTables.size} mesas
                </span>
                <span className="font-bold text-foreground">{money(multiTotal)}</span>
              </div>
              <Pay pending={checkoutMulti.isPending} label="Cobrar todas con" onPay={cobrarMulti} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
