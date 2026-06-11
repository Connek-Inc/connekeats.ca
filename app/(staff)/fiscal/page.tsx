"use client";
// Panel del motor fiscal (SEV/MEV-WEB). El dueño/gerente genera la factura fiscal
// desde una cuenta, ve la factura oficial (todos los campos de Revenu Québec),
// la cola de pendientes, transmite (stub hasta certificación), emite nota de
// crédito / anula, y revisa el log de auditoría.

import { Button, Card, Input, Spinner } from "@heroui/react";
import { AlertTriangle, ArrowLeft, Ban, FileText, Printer, RefreshCw, ScrollText, Send } from "lucide-react";
import { useState } from "react";

import { useBusiness } from "@/lib/business";
import {
  useBills,
  useCancelFiscal,
  useFiscalAudit,
  useFiscalCreditNote,
  useFiscalFromBill,
  useFiscalInvoice,
  useFiscalList,
  useFiscalPending,
  useTransmitFiscal,
} from "@/lib/hooks";
import { useToast } from "@/lib/toast";
import type { FiscalTransaction } from "@/lib/types";

const money = (n: number | null | undefined) => `$${(Number(n) || 0).toFixed(2)}`;

const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Borrador", tone: "text-foreground/50" },
  ready_to_transmit: { label: "Lista p/ transmitir", tone: "text-amber-500" },
  transmitted: { label: "Transmitida", tone: "text-sky-500" },
  mev_accepted: { label: "MEV aceptó", tone: "text-emerald-500" },
  official_issued: { label: "Factura oficial", tone: "text-emerald-500" },
  paid: { label: "Pagada", tone: "text-emerald-500" },
  closed: { label: "Cerrada", tone: "text-foreground/60" },
  cancelled: { label: "Anulada", tone: "text-rose-500" },
  credit_note_issued: { label: "Nota de crédito", tone: "text-rose-400" },
  transmission_failed: { label: "Falló transmisión", tone: "text-rose-500" },
  pending_retry: { label: "En cola (reintentar)", tone: "text-amber-500" },
};
const DOC: Record<string, string> = {
  facture: "Facture",
  note_credit: "Note de crédit",
  annulation: "Annulation",
  duplicata: "Duplicata",
  correction: "Correction",
  addition: "Addition",
  fermeture: "Reçu de fermeture",
};

export default function FiscalPage() {
  const { businessId } = useBusiness();
  const { show } = useToast();
  const txns = useFiscalList(businessId);
  const pending = useFiscalPending(businessId);
  const bills = useBills(businessId);
  const fromBill = useFiscalFromBill(businessId ?? 0);
  const transmit = useTransmitFiscal(businessId ?? 0);
  const [selected, setSelected] = useState<number | null>(null);

  if (selected != null && businessId) {
    return <Detail businessId={businessId} txnId={selected} onBack={() => setSelected(null)} />;
  }

  const paidBills = (bills.data ?? []).filter((b) => b.status === "paid").slice(0, 8);
  const list = txns.data ?? [];

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Facturación fiscal · SEV</h1>
      </header>

      <Card className="mb-6 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground/70">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <span>
          La <b>transmisión al MEV-WEB</b> está pendiente de la certificación con Revenu Québec (code d&apos;autorisation
          + certificat + guías SW-73). Hasta entonces, &ldquo;Transmitir&rdquo; deja la transacción en cola. El resto del
          motor (factura, impuestos, estados, auditoría) ya funciona. Ver <b>FISCAL_ENGINE.md</b>.
        </span>
      </Card>

      {/* Generar factura fiscal desde una cuenta pagada */}
      <section className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Generar factura fiscal desde una cuenta</p>
        <Card className="glass flex flex-col gap-1.5 rounded-3xl p-4">
          {paidBills.length ? (
            paidBills.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground/75">
                  Cuenta #{b.id} · Mesa {b.table_id} · {money(b.total)}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={fromBill.isPending}
                  onPress={() =>
                    fromBill.mutate(b.id, {
                      onSuccess: () => show("Factura fiscal generada", "success"),
                      onError: (e) => show(e instanceof Error ? e.message : "No se pudo generar", "error"),
                    })
                  }
                >
                  <span className="flex items-center gap-1">
                    <FileText className="size-3.5" /> Generar
                  </span>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-foreground/40">No hay cuentas pagadas recientes.</p>
          )}
        </Card>
      </section>

      {/* Cola de pendientes */}
      {(pending.data?.length ?? 0) > 0 && (
        <section className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-amber-500">
            <RefreshCw className="size-3.5" /> Pendientes de transmisión ({pending.data!.length})
          </p>
          <Card className="glass flex flex-col gap-1.5 rounded-3xl p-4">
            {pending.data!.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <button onClick={() => setSelected(t.id)} className="text-left text-foreground/75 underline-offset-2 hover:underline">
                  {t.transaction_no} · {money(t.total)}
                </button>
                <Button
                  size="sm"
                  variant="primary"
                  isDisabled={transmit.isPending}
                  onPress={() =>
                    transmit.mutate(t.id, {
                      onSuccess: (r) => show(r?.ok ? "Transmitida" : r?.error || "En cola (SEV no certificado)", r?.ok ? "success" : "info"),
                      onError: () => show("No se pudo transmitir", "error"),
                    })
                  }
                >
                  <span className="flex items-center gap-1">
                    <Send className="size-3.5" /> Transmitir
                  </span>
                </Button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Todas las transacciones fiscales */}
      <section>
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Transacciones fiscales</p>
        {txns.isLoading ? (
          <Spinner color="accent" />
        ) : list.length ? (
          <div className="flex flex-col gap-2">
            {list.map((t) => (
              <Row key={t.id} t={t} onOpen={() => setSelected(t.id)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground/40">Aún no hay transacciones fiscales. Genera una desde una cuenta arriba.</p>
        )}
      </section>
    </main>
  );
}

function Row({ t, onOpen }: { t: FiscalTransaction; onOpen: () => void }) {
  const st = STATUS[t.status] ?? { label: t.status, tone: "text-foreground/50" };
  return (
    <button onClick={onOpen} className="glass flex items-center justify-between rounded-2xl p-3 text-left">
      <span className="flex flex-col">
        <span className="font-semibold text-foreground">{t.transaction_no}</span>
        <span className="text-xs text-foreground/45">
          {DOC[t.doc_type] ?? t.doc_type} · {new Date(t.created_at).toLocaleString()}
        </span>
      </span>
      <span className="flex flex-col items-end">
        <span className="font-bold text-foreground">{money(t.total)}</span>
        <span className={`text-[11px] font-medium ${st.tone}`}>{st.label}</span>
      </span>
    </button>
  );
}

function Detail({ businessId, txnId, onBack }: { businessId: number; txnId: number; onBack: () => void }) {
  const inv = useFiscalInvoice(businessId, txnId);
  const audit = useFiscalAudit(businessId, txnId);
  const transmit = useTransmitFiscal(businessId);
  const creditNote = useFiscalCreditNote(businessId);
  const cancel = useCancelFiscal(businessId);
  const { show } = useToast();
  const d = inv.data;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver
        </button>
        <Button size="sm" variant="secondary" onPress={() => window.print()}>
          <span className="flex items-center gap-1.5">
            <Printer className="size-4" /> Imprimir
          </span>
        </Button>
      </div>

      {inv.isLoading || !d ? (
        <Spinner color="accent" />
      ) : (
        <>
          {/* Factura oficial (todos los campos exigidos por Revenu Québec) */}
          <Card className="flex flex-col gap-2 rounded-3xl bg-white p-6 text-black">
            <div className="text-center">
              <h2 className="text-xl font-black">{d.establishment_name || "Établissement"}</h2>
              {d.establishment_address && <p className="text-xs text-black/60">{d.establishment_address}</p>}
              <p className="mt-1 text-xs text-black/60">
                TPS {d.tps_number || "—"} · TVQ {d.tvq_number || "—"}
              </p>
            </div>
            <div className="my-1 border-y-2 border-double border-black py-1 text-center text-[11px] font-semibold uppercase">
              {DOC[d.doc_type] ?? d.doc_type}
            </div>
            <div className="flex justify-between text-xs text-black/70">
              <span>N° {d.transaction_no}</span>
              <span>{d.table_label || d.order_type || ""}</span>
            </div>
            <div className="text-[11px] text-black/60">
              Transmission: {d.moment_transmission} · N° transaction: {d.numero_transaction}
            </div>

            <table className="mt-2 w-full text-sm">
              <tbody>
                {(d.items || []).map((it, i) => (
                  <tr key={i} className="border-b border-black/10 align-top">
                    <td className="py-1">
                      {it.quantity}× {it.description}
                      {(it.tax_codes?.length ?? 0) > 0 && (
                        <span className="ml-1 text-[10px] text-black/45">[{it.tax_codes!.join("")}]</span>
                      )}
                      {(it.modifiers?.length ?? 0) > 0 && (
                        <span className="block text-[11px] text-black/50">{it.modifiers!.join(", ")}</span>
                      )}
                    </td>
                    <td className="py-1 text-right font-mono tabular-nums">{money(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-1 flex flex-col gap-0.5 text-sm">
              <Line label="Sous-total" value={money(d.subtotal)} />
              {Number(d.discount) > 0 && <Line label="Rabais" value={`−${money(d.discount)}`} />}
              <Line label="TPS" value={money(d.tps)} />
              <Line label="TVQ" value={money(d.tvq)} />
              {Number(d.tip) > 0 && <Line label="Pourboire" value={money(d.tip)} />}
              <div className="mt-0.5 border-t border-black pt-0.5">
                <Line label="TOTAL" value={money(d.total)} bold />
              </div>
              <Line label="Mode de paiement" value={d.payment_method || "—"} />
            </div>

            {/* Código QR fiscal + mención (placeholder hasta certificación) */}
            <div className="mt-3 flex flex-col items-center gap-1 border-t border-black/20 pt-3">
              <div className="grid size-20 place-items-center rounded border-2 border-dashed border-black/30 text-[9px] text-black/40">
                {d.mev_qr_payload ? "QR" : "QR fiscal\n(post-certif.)"}
              </div>
              <p className="text-[10px] underline">{d.mention}</p>
              {!d.certified && (
                <p className="text-center text-[9px] text-black/40">
                  Documento NO certificado — transmisión MEV-WEB pendiente
                </p>
              )}
            </div>
          </Card>

          {/* Acciones fiscales */}
          <div className="mt-4 grid grid-cols-3 gap-2 print:hidden">
            <Button
              variant="primary"
              isDisabled={transmit.isPending}
              onPress={() =>
                transmit.mutate(txnId, {
                  onSuccess: (r) => show(r?.ok ? "Transmitida" : r?.error || "En cola (SEV no certificado)", r?.ok ? "success" : "info"),
                  onError: () => show("No se pudo transmitir", "error"),
                })
              }
            >
              <span className="flex items-center justify-center gap-1">
                <Send className="size-4" /> Transmitir
              </span>
            </Button>
            <Button
              variant="secondary"
              isDisabled={creditNote.isPending}
              onPress={() => {
                if (!window.confirm("¿Emitir nota de crédito que reversa esta factura?")) return;
                creditNote.mutate(
                  { txnId },
                  { onSuccess: () => show("Nota de crédito emitida", "success"), onError: (e) => show(e instanceof Error ? e.message : "Error", "error") },
                );
              }}
            >
              <span className="flex items-center justify-center gap-1">
                <ScrollText className="size-4" /> Nota crédito
              </span>
            </Button>
            <Button
              variant="secondary"
              isDisabled={cancel.isPending}
              onPress={() => {
                if (!window.confirm("¿Anular esta transacción fiscal?")) return;
                cancel.mutate(
                  { txnId },
                  { onSuccess: () => show("Anulada", "success"), onError: (e) => show(e instanceof Error ? e.message : "No se puede anular en este estado", "error") },
                );
              }}
            >
              <span className="flex items-center justify-center gap-1">
                <Ban className="size-4" /> Anular
              </span>
            </Button>
          </div>

          {/* Auditoría */}
          <section className="mt-6 print:hidden">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/50">
              <ScrollText className="size-3.5" /> Auditoría
            </p>
            <Card className="glass flex flex-col gap-1.5 rounded-2xl p-3">
              {audit.data?.length ? (
                audit.data.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-foreground/70">{a.action}</span>
                    <span className="text-foreground/40">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-foreground/40">Sin registros.</p>
              )}
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-base font-black" : ""}`}>
      <span className={bold ? "" : "text-black/70"}>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
