"use client";

import { Button, Card, Chip, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  ConciergeBell,
  CreditCard,
  Hand,
  HandCoins,
  Landmark,
  type LucideIcon,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FloorMap } from "@/components/FloorMap";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import {
  useAckRequest,
  useBills,
  useCheckoutTable,
  useCreateStaffOrder,
  useMarkBillPaid,
  useMenu,
  useOrderWithItems,
  useOrders,
  useServiceRequests,
  useTables,
  useUpdateTable,
} from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { tableColor } from "@/lib/tableColor";
import { useToast } from "@/lib/toast";
import type { ServiceRequest, Table } from "@/lib/types";

const SR_LABEL: Record<ServiceRequest["type"], string> = {
  call_waiter: "Llama al mesero",
  request_item: "Pide algo",
  request_bill: "Pide la cuenta",
};
const SR_ICON: Record<ServiceRequest["type"], LucideIcon> = {
  call_waiter: ConciergeBell,
  request_item: Hand,
  request_bill: CreditCard,
};
const TABLE_STATUS: Record<string, string> = {
  available: "Libre",
  occupied: "Ocupada",
  reserved: "Reservada",
  cleaning: "Limpieza",
  bill_requested: "Cuenta pedida",
};
const ACTIVE_ORDER = ["open", "sent", "preparing", "ready", "served"];

const reqText = (r: ServiceRequest) =>
  SR_LABEL[r.type] +
  (r.payload && (r.payload as { text?: string }).text ? ` — ${(r.payload as { text?: string }).text}` : "");

// Etiqueta de solicitud con su icono (se usa en avisos y en el detalle de mesa).
function ReqLine({ r, className }: { r: ServiceRequest; className?: string }) {
  const Icon = SR_ICON[r.type];
  return (
    <span className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <Icon className="size-4 shrink-0" /> {reqText(r)}
    </span>
  );
}

const PAY_METHODS: [string, LucideIcon, string][] = [
  ["cash", Banknote, "Efectivo"],
  ["card", CreditCard, "Tarjeta"],
  ["transfer", Landmark, "Transferencia"],
];

function PayPicker({ onPay, pending }: { onPay: (m: string) => void; pending?: boolean }) {
  return (
    <div className="flex gap-1.5">
      {PAY_METHODS.map(([m, Icon, label]) => (
        <Button
          key={m}
          isIconOnly
          size="sm"
          variant="secondary"
          className="rounded-full"
          aria-label={`Cobrar con ${label}`}
          isDisabled={pending}
          onPress={() => onPay(m)}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </div>
  );
}

export default function WaiterPage() {
  const { businessId } = useBusiness();
  const { roles } = useAuth();
  const qc = useQueryClient();
  const requests = useServiceRequests(businessId);
  const tables = useTables(businessId);
  const bills = useBills(businessId);
  const ack = useAckRequest(businessId!);
  const markPaid = useMarkBillPaid(businessId!);
  const [selected, setSelected] = useState<number | null>(null);
  const [onlyMyZone, setOnlyMyZone] = useState(true);
  // Zona asignada al mesero (de su rol). El dueño ve todas (no tiene zona).
  const myFloorId = roles.find((r) => r.business_id === businessId && r.role === "waiter")?.floor_id ?? null;

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["service-requests", businessId] });
    qc.invalidateQueries({ queryKey: ["bills", businessId] });
    qc.invalidateQueries({ queryKey: ["tables", businessId] });
    qc.invalidateQueries({ queryKey: ["orders", businessId] });
  }, [qc, businessId]);

  useRealtime("service_request", businessId, refresh);
  useRealtime("tables", businessId, refresh);
  useRealtime("orders", businessId, refresh);

  const openByTable = useMemo(() => {
    const m: Record<number, number> = {};
    (requests.data ?? [])
      .filter((r) => r.status !== "done")
      .forEach((r) => (m[r.table_id] = (m[r.table_id] ?? 0) + 1));
    return m;
  }, [requests.data]);

  const calledIds = useMemo(
    () => new Set(Object.entries(openByTable).filter(([, n]) => n > 0).map(([id]) => Number(id))),
    [openByTable],
  );
  const tableLabel = (id: number) => tables.data?.find((t) => t.id === id)?.label ?? `Mesa ${id}`;
  const openRequests = (requests.data ?? []).filter((r) => r.status !== "done");
  const pendingBills = bills.data?.filter((b) => b.status === "pending") ?? [];
  const selectedTable = tables.data?.find((t) => t.id === selected) ?? null;
  const visibleTables = (tables.data ?? []).filter((t) =>
    onlyMyZone && myFloorId ? t.floor_id === myFloorId : true,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mesero</h1>
      </header>

      {/* ── Avisos en vivo ── */}
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Avisos en vivo</p>
      <div className="mb-7 flex flex-col gap-2">
        {openRequests.length ? (
          openRequests.map((r) => {
            const c = tableColor(r.table_id);
            return (
              <Card
                key={r.id}
                style={{ borderLeftColor: c.hex, borderLeftWidth: 5, borderLeftStyle: "solid" }}
                className={`flex flex-row items-center justify-between rounded-3xl p-4 ${
                  r.status === "open" ? "bg-foreground/[0.07]" : "glass"
                }`}
              >
                <button className="flex-1 pr-2 text-left" onClick={() => setSelected(r.table_id)}>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.hex }} />
                    <p className="font-semibold text-foreground">{tableLabel(r.table_id)}</p>
                    <span className="text-xs text-foreground/45">{c.name}</span>
                    {r.status === "ack" && (
                      <Chip color="accent" size="sm">
                        en camino
                      </Chip>
                    )}
                  </div>
                  <div className="mt-0.5 text-foreground/65">
                    <ReqLine r={r} />
                  </div>
                </button>
                <div className="flex gap-2">
                  {r.status === "open" && (
                    <Button variant="primary" size="sm" onPress={() => ack.mutate({ id: r.id, action: "ack" })}>
                      Voy
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onPress={() => ack.mutate({ id: r.id, action: "done" })}>
                    Hecho
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="flex items-center gap-1.5 text-foreground/40">
            <CheckCircle2 className="size-4" /> Sin avisos pendientes
          </p>
        )}
      </div>

      {/* ── Salón (mesas) ── */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Salón · {visibleTables.length} mesas</p>
        {myFloorId && (
          <Button size="sm" variant="secondary" className="rounded-full" onPress={() => setOnlyMyZone((v) => !v)}>
            {onlyMyZone ? "Ver todas" : "Mi zona"}
          </Button>
        )}
      </div>
      <div className="mb-7">
        {visibleTables.length ? (
          <FloorMap
            tables={visibleTables}
            calledIds={calledIds}
            onSelect={setSelected}
            statusLabel={(t) => TABLE_STATUS[t.status] ?? t.status}
          />
        ) : (
          <p className="text-foreground/40">{tables.data?.length ? "No hay mesas en tu zona." : "Aún no hay mesas."}</p>
        )}
      </div>

      {/* ── Cobros pendientes ── */}
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Cuentas por cobrar</p>
      <div className="flex flex-col gap-2">
        {pendingBills.length ? (
          pendingBills.map((b) => {
            const c = tableColor(b.table_id);
            return (
              <Card
                key={b.id}
                style={{ borderLeftColor: c.hex, borderLeftWidth: 5, borderLeftStyle: "solid" }}
                className="flex flex-row items-center justify-between rounded-3xl border border-dashed border-foreground/25 bg-foreground/[0.05] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.hex }} />
                    <p className="font-semibold text-foreground">{tableLabel(b.table_id)}</p>
                  </div>
                  <p className="text-foreground/65">${Number(b.total).toFixed(2)} · pedida por {b.requested_by}</p>
                </div>
                <PayPicker
                  pending={markPaid.isPending}
                  onPay={(m) => markPaid.mutate({ billId: b.id, paymentMethod: m })}
                />
              </Card>
            );
          })
        ) : (
          <p className="text-foreground/40">Nada por cobrar.</p>
        )}
      </div>

      {selectedTable && (
        <TableModal businessId={businessId!} table={selectedTable} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}

function TableModal({ businessId, table, onClose }: { businessId: number; table: Table; onClose: () => void }) {
  const c = tableColor(table.id);
  const orders = useOrders(businessId);
  const requests = useServiceRequests(businessId);
  const ack = useAckRequest(businessId);
  const checkout = useCheckoutTable(businessId);
  const freeTable = useUpdateTable(businessId);
  const menu = useMenu(businessId);
  const createOrder = useCreateStaffOrder(businessId);
  const { show } = useToast();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [tab, setTab] = useState<"resumen" | "pedir">("resumen");

  const activeOrder = orders.data?.find((o) => o.table_id === table.id && ACTIVE_ORDER.includes(o.status)) ?? null;
  const detail = useOrderWithItems(businessId, activeOrder?.id ?? null);
  const tableReqs = (requests.data ?? []).filter((r) => r.table_id === table.id && r.status !== "done");
  const items = menu.data?.items ?? [];
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => ({ item: items.find((i) => i.id === Number(id))!, qty }))
    .filter((l) => l.item);
  const cartTotal = cartLines.reduce((s, l) => s + (Number(l.item.price) || 0) * l.qty, 0);

  const add = (id: number) => setCart((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const sub = (id: number) =>
    setCart((p) => {
      const n = (p[id] ?? 0) - 1;
      const next = { ...p };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  async function send() {
    if (!cartLines.length) return;
    try {
      await createOrder.mutateAsync({
        table_id: table.id,
        items: cartLines.map((l) => ({ menu_item_id: l.item.id, qty: l.qty })),
      });
      setCart({});
      setTab("resumen");
      show("Pedido enviado a cocina", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar el pedido", "error");
    }
  }
  async function cobrar(method: string) {
    try {
      await checkout.mutateAsync({ tableId: table.id, paymentMethod: method });
      show("Mesa cobrada", "success");
      onClose();
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo cobrar", "error");
    }
  }
  async function liberar() {
    try {
      await freeTable.mutateAsync({ tableId: table.id, data: { status: "available" } });
      show("Mesa liberada · lista para el próximo", "success");
      onClose();
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo liberar (¿cuenta pendiente?)", "error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl"
        style={{ borderTop: `4px solid ${c.hex}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
              <h2 className="text-xl font-bold text-foreground">{table.label}</h2>
            </div>
            <p className="text-sm text-foreground/50">
              {c.name} · {TABLE_STATUS[table.status] ?? table.status}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-foreground/50 hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {(["resumen", "pedir"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "primary" : "secondary"}
              className="rounded-full"
              onPress={() => setTab(t)}
            >
              {t === "resumen" ? "Resumen" : "Tomar pedido"}
            </Button>
          ))}
        </div>

        {tab === "resumen" ? (
          <div className="flex flex-col gap-4">
            {/* Solicitudes de esta mesa */}
            {tableReqs.length > 0 && (
              <div className="flex flex-col gap-2">
                {tableReqs.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-2xl bg-foreground/[0.06] p-3"
                  >
                    <ReqLine r={r} className="text-sm text-foreground/80" />
                    <div className="flex gap-2">
                      {r.status === "open" && (
                        <Button size="sm" variant="primary" onPress={() => ack.mutate({ id: r.id, action: "ack" })}>
                          Voy
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onPress={() => ack.mutate({ id: r.id, action: "done" })}>
                        Hecho
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pedido actual */}
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Pedido actual</p>
              {activeOrder ? (
                <Card className="glass rounded-2xl p-3">
                  {detail.data?.items?.length ? (
                    detail.data.items.map((it) => (
                      <div key={it.id} className="mb-1 flex justify-between text-sm">
                        <span className="text-foreground/75">
                          {it.qty}× {it.name_snapshot}{" "}
                          <span className="text-foreground/40">({it.status})</span>
                        </span>
                        <span className="text-foreground">${(it.price_snapshot * it.qty).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-foreground/40">Cargando…</p>
                  )}
                  <div className="mt-2 flex justify-between border-t border-foreground/10 pt-2 font-bold text-foreground">
                    <span>Total</span>
                    <span>${Number(activeOrder.total).toFixed(2)}</span>
                  </div>
                </Card>
              ) : (
                <p className="text-sm text-foreground/40">Sin pedido activo en esta mesa.</p>
              )}
            </div>

            {/* Cobrar */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/50">
                <HandCoins className="size-3.5" /> Cobrar{activeOrder ? ` · $${Number(activeOrder.total).toFixed(2)}` : ""} con:
              </p>
              <PayPicker pending={checkout.isPending} onPay={(m) => cobrar(m)} />
            </div>

            {/* Liberar la mesa para el próximo cliente (el backend impide si hay cuenta pendiente) */}
            <Button variant="secondary" fullWidth isDisabled={freeTable.isPending} onPress={liberar}>
              {freeTable.isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="size-4" /> Liberar mesa (lista para nuevo cliente)
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 pb-20">
            {items.length ? (
              items.map((it) => (
                <div key={it.id} className="glass flex items-center justify-between rounded-2xl p-3">
                  <div className="pr-2">
                    <p className="text-sm font-medium text-foreground">{it.name}</p>
                    <p className="text-xs text-foreground/55">${Number(it.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cart[it.id] ? (
                      <>
                        <Button isIconOnly size="sm" variant="secondary" className="rounded-full" onPress={() => sub(it.id)}>
                          −
                        </Button>
                        <span className="w-5 text-center text-foreground">{cart[it.id]}</span>
                      </>
                    ) : null}
                    <Button isIconOnly size="sm" variant="primary" className="rounded-full" onPress={() => add(it.id)}>
                      +
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-foreground/40">Este menú no tiene ítems.</p>
            )}

            {cartLines.length > 0 && (
              <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 border-t border-foreground/10 bg-surface p-4">
                <Button variant="primary" size="lg" fullWidth isDisabled={createOrder.isPending} onPress={send}>
                  {createOrder.isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    `Enviar a cocina · $${cartTotal.toFixed(2)}`
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
