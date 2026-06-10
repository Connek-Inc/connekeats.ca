"use client";
// Módulo Delivery / para llevar: crear pedidos sin mesa (cliente + ítems del
// menú) y avanzarlos por su pipeline (recibido → preparando → listo → en camino
// → entregado). Pedidos guardados en su propia tabla.

import { Button, Card, Input, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Bike, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import {
  useCreateDeliveryOrder,
  useDeleteDeliveryOrder,
  useDeliveryOrders,
  useMenu,
  useUpdateDeliveryOrder,
} from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { useToast } from "@/lib/toast";
import type { DeliveryStatus } from "@/lib/types";

const FLOW: DeliveryStatus[] = ["received", "preparing", "ready", "out", "delivered"];
const LABEL: Record<DeliveryStatus, string> = {
  received: "Recibido",
  preparing: "Preparando",
  ready: "Listo",
  out: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function DeliveryBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["delivery", businessId] }), [qc, businessId]);
  useRealtime("delivery_order", businessId, refresh);
  const orders = useDeliveryOrders(businessId);
  const menu = useMenu(businessId);
  const create = useCreateDeliveryOrder(businessId);
  const update = useUpdateDeliveryOrder(businessId);
  const del = useDeleteDeliveryOrder(businessId);
  const { show } = useToast();

  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});

  const items = menu.data?.items ?? [];
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ item: items.find((i) => i.id === Number(id))!, qty }))
    .filter((l) => l.item);
  const total = lines.reduce((s, l) => s + (Number(l.item.price) || 0) * l.qty, 0);
  const add = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const sub = (id: number) =>
    setCart((c) => {
      const n = (c[id] ?? 0) - 1;
      const x = { ...c };
      if (n <= 0) delete x[id];
      else x[id] = n;
      return x;
    });

  const list = orders.data ?? [];
  const active = list.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const done = list.filter((o) => o.status === "delivered" || o.status === "cancelled").slice(0, 10);

  const submit = async () => {
    if (!customer.trim()) return show("Nombre del cliente", "error");
    if (!lines.length) return show("Agrega al menos un ítem", "error");
    try {
      await create.mutateAsync({
        customer: customer.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        items: lines.map((l) => ({ name: l.item.name, price: Number(l.item.price) || 0, qty: l.qty })),
      });
      setCustomer("");
      setPhone("");
      setAddress("");
      setCart({});
      setOpen(false);
      show("Pedido creado", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo crear", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Nuevo pedido */}
      <section className="flex flex-col gap-2">
        <Button variant={open ? "secondary" : "primary"} onPress={() => setOpen((v) => !v)}>
          <span className="flex items-center justify-center gap-2">
            <Bike className="size-4" /> {open ? "Cerrar" : "Nuevo pedido para llevar"}
          </span>
        </Button>
        {open && (
          <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
            <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Cliente *" fullWidth />
            <div className="flex gap-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" fullWidth />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" fullWidth />
            </div>
            <p className="text-xs uppercase tracking-wide text-foreground/50">Ítems</p>
            <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
              {items.length ? (
                items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-2 rounded-xl bg-foreground/[0.04] px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {it.name} <span className="text-foreground/40">${Number(it.price).toFixed(2)}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {cart[it.id] ? (
                        <>
                          <button onClick={() => sub(it.id)} className="grid size-7 place-items-center rounded-full bg-foreground/10 text-foreground">
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-4 text-center text-sm text-foreground">{cart[it.id]}</span>
                        </>
                      ) : null}
                      <button onClick={() => add(it.id)} className="grid size-7 place-items-center rounded-full bg-foreground text-background">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground/40">Tu menú está vacío (agrega ítems en Setup).</p>
              )}
            </div>
            <Button variant="primary" isDisabled={create.isPending} onPress={submit}>
              Crear pedido · ${total.toFixed(2)}
            </Button>
          </Card>
        )}
      </section>

      {/* En curso */}
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">En curso · {active.length}</p>
        {orders.isLoading ? (
          <Spinner color="accent" size="sm" />
        ) : active.length ? (
          active.map((o) => {
            const idx = FLOW.indexOf(o.status);
            const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
            return (
              <Card key={o.id} className="glass flex flex-col gap-2 rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{o.customer}</p>
                    <p className="truncate text-xs text-foreground/50">
                      {[o.phone, o.address].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-foreground/20 px-2.5 py-1 text-xs font-semibold text-foreground">
                    {LABEL[o.status]}
                  </span>
                </div>
                <p className="text-xs text-foreground/60">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">${Number(o.total).toFixed(2)}</span>
                  <div className="flex items-center gap-3">
                    {next && (
                      <Button size="sm" variant="primary" className="rounded-full" onPress={() => update.mutate({ id: o.id, status: next })}>
                        <span className="flex items-center gap-1">
                          {LABEL[next]} <ChevronRight className="size-4" />
                        </span>
                      </Button>
                    )}
                    <button onClick={() => update.mutate({ id: o.id, status: "cancelled" })} className="text-xs text-foreground/50 hover:text-foreground">
                      Cancelar
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-foreground/40">No hay pedidos en curso.</p>
        )}
      </section>

      {/* Recientes */}
      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Recientes</p>
          {done.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-2xl border border-foreground/10 px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-foreground/70">
                {o.customer} · {LABEL[o.status]} · ${Number(o.total).toFixed(2)}
              </span>
              <button aria-label="Borrar" onClick={() => del.mutate(o.id)} className="shrink-0 text-foreground/40 transition hover:text-foreground">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
