"use client";
// Factura fiscal imprimible (ruta limpia, sin chrome de la app → ideal para
// imprimir o "Guardar como PDF" desde el navegador).

import { Button, Spinner } from "@heroui/react";
import { ArrowLeft, Printer, UtensilsCrossed } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { useBusiness } from "@/lib/business";
import { useInvoice } from "@/lib/hooks";

export default function FacturaPage() {
  const { billId } = useParams<{ billId: string }>();
  const { businessId } = useBusiness();
  const router = useRouter();
  const id = billId ? Number(billId) : null;
  const inv = useInvoice(businessId ?? 0, id);

  const cur = inv.data?.business.currency || "USD";
  const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

  if (inv.isLoading || !businessId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white">
        <Spinner color="current" size="lg" />
      </main>
    );
  }
  if (inv.isError || !inv.data) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white text-black">
        <p>No se pudo cargar la factura.</p>
        <Button variant="secondary" onPress={() => router.back()}>Volver</Button>
      </main>
    );
  }

  const d = inv.data;
  const b = d.business;

  return (
    <main className="min-h-dvh bg-neutral-100 py-8 text-black print:bg-white print:py-0">
      {/* Barra (no se imprime) */}
      <div className="mx-auto mb-4 flex max-w-md items-center justify-between px-4 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-neutral-600">
          <ArrowLeft className="size-4" /> Volver
        </button>
        <Button size="sm" variant="primary" onPress={() => window.print()}>
          <span className="flex items-center gap-1.5">
            <Printer className="size-4" /> Imprimir / PDF
          </span>
        </Button>
      </div>

      {/* Hoja de la factura */}
      <div className="mx-auto max-w-md bg-white p-8 shadow-sm print:max-w-full print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="flex items-center gap-1.5 text-lg font-bold">
              <UtensilsCrossed className="size-5" /> {b.legal_name || b.name || "Negocio"}
            </p>
            {b.tax_id && <p className="text-xs text-neutral-500">N° fiscal: {b.tax_id}</p>}
            {b.address && <p className="text-xs text-neutral-500">{b.address}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">FACTURA</p>
            <p className="text-xs text-neutral-500">{d.invoice_no}</p>
            {d.issued_at && <p className="text-xs text-neutral-500">{new Date(d.issued_at).toLocaleString()}</p>}
          </div>
        </header>

        <table className="mb-4 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <th className="pb-1 font-medium">Descripción</th>
              <th className="pb-1 text-center font-medium">Cant.</th>
              <th className="pb-1 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {d.items.length ? (
              d.items.map((it, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-1.5">{it.name_snapshot}</td>
                  <td className="py-1.5 text-center">{it.qty}</td>
                  <td className="py-1.5 text-right">{money(it.price_snapshot * it.qty)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="py-2 text-neutral-400">Consumo</td></tr>
            )}
          </tbody>
        </table>

        <div className="ml-auto flex w-56 flex-col gap-1 text-sm">
          <Row label="Subtotal" value={money(d.subtotal)} />
          {d.discount > 0 && <Row label="Descuento" value={`- ${money(d.discount)}`} />}
          <Row label={`Impuesto (${b.tax_rate}% incl.)`} value={money(d.tax)} />
          {d.tip > 0 && <Row label="Propina" value={money(d.tip)} />}
          <div className="mt-1 flex justify-between border-t border-neutral-300 pt-2 text-base font-bold">
            <span>TOTAL</span>
            <span>{money(d.total)}</span>
          </div>
          {d.payment_method && <p className="mt-1 text-right text-xs text-neutral-500">Pago: {d.payment_method}</p>}
        </div>

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-center text-xs text-neutral-400">
          Gracias por tu visita · Connek Food
        </footer>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
