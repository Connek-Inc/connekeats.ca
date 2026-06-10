"use client";
// Panel de cobro del mesero con 3 modos:
//   • Toda la mesa  → descuento + propina + cobro completo (checkout)
//   • Dividir       → pagos parciales: partes iguales (entre N) o por ítem
//   • Varias mesas  → un cliente paga varias mesas de una (checkout-multi)
import { Button, Card, Spinner } from "@heroui/react";
import { Banknote, CreditCard, Landmark, type LucideIcon, Users } from "lucide-react";
import { useState } from "react";

import { useAddPayment, useBillDetail, useCheckoutMulti, useCheckoutTable, useOpenBill } from "@/lib/hooks";
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
  const [mode, setMode] = useState<"full" | "split" | "multi">("full");

  const checkout = useCheckoutTable(businessId);
  const openBill = useOpenBill(businessId);
  const addPayment = useAddPayment(businessId);
  const checkoutMulti = useCheckoutMulti(businessId);

  // ── Toda la mesa: descuento + propina ──
  const [discount, setDiscount] = useState("");
  const [tip, setTip] = useState("");
  const fullTotal = Math.max(0, orderTotal - (Number(discount) || 0) + (Number(tip) || 0));
  async function cobrarFull(method: string) {
    try {
      await checkout.mutateAsync({ tableId, paymentMethod: method, discount: Number(discount) || 0, tip: Number(tip) || 0 });
      show(`Mesa cobrada · ${money(fullTotal)}`, "success");
      onDone();
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
        onDone();
      } else {
        show(`Pago de ${money(amount)} · faltan ${money(r.remaining)}`, "success");
      }
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo registrar el pago", "error");
    }
  }

  // ── Varias mesas ──
  const [selTables, setSelTables] = useState<Set<number>>(new Set());
  const multiTotal = orderTotal + otherTables.filter((t) => selTables.has(t.id)).reduce((s, t) => s + t.total, 0);
  async function cobrarMulti(method: string) {
    try {
      const r = await checkoutMulti.mutateAsync({ tableIds: [tableId, ...selTables], paymentMethod: method });
      show(`${r.bill_ids.length} mesas cobradas · ${money(r.total)}`, "success");
      onDone();
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo cobrar", "error");
    }
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
            <div className="flex justify-between border-t border-foreground/10 pt-2 font-bold text-foreground">
              <span>Total</span>
              <span>{money(fullTotal)}</span>
            </div>
          </div>
          <Pay pending={checkout.isPending} onPay={cobrarFull} />
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
                      label={`Cobrar selección (${money(selSum)})`}
                      onPay={(m) => pay(selSum, m, items.filter((it) => sel.has(it.id)).map((it) => it.name_snapshot).join(", "))}
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
