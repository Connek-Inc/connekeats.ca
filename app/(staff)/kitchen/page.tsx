"use client";

import { Button, Card, Chip } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { KdsItems } from "@/components/KdsItems";
import { StockPanel } from "@/components/StockPanel";
import { useBusiness } from "@/lib/business";
import { useMenu, useOrderWithItems, useOrders, useSetItemStatus, useSetOrderStatus } from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { tableColor } from "@/lib/tableColor";
import type { Order } from "@/lib/types";

const ACTIVE = ["sent", "preparing", "ready"];
const STATUS_COLOR: Record<string, "accent" | "warning" | "success" | "default"> = {
  sent: "default",
  preparing: "default",
  ready: "accent",
};

export default function KitchenPage() {
  const { businessId } = useBusiness();
  const qc = useQueryClient();
  const orders = useOrders(businessId);
  const menu = useMenu(businessId);
  // Ítems que van a la BARRA (no se muestran en Cocina).
  const barIds = useMemo(
    () => new Set((menu.data?.items ?? []).filter((i) => i.station === "bar").map((i) => i.id)),
    [menu.data],
  );

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["orders", businessId] }), [qc, businessId]);
  useRealtime("orders", businessId, refresh);
  useRealtime("order_item", businessId, refresh);

  const active = (orders.data ?? []).filter((o) => ACTIVE.includes(o.status));

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cocina · KDS</h1>
      </header>

      {active.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((o) => (
            <KitchenCard key={o.id} businessId={businessId!} order={o} barIds={barIds} />
          ))}
        </div>
      ) : (
        <p className="text-foreground/40">Sin pedidos activos.</p>
      )}

      {businessId && <StockPanel businessId={businessId} />}
    </main>
  );
}

function KitchenCard({ businessId, order, barIds }: { businessId: number; order: Order; barIds: Set<number> }) {
  const detail = useOrderWithItems(businessId, order.id);
  const setItem = useSetItemStatus(businessId);
  const setOrder = useSetOrderStatus(businessId);

  // Solo ítems de COCINA (los de barra van al tablero de la barra).
  const items = (detail.data?.items ?? []).filter(
    (it) => !(it.menu_item_id != null && barIds.has(it.menu_item_id)),
  );
  if (detail.isSuccess && items.length === 0) return null;

  return (
    <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tableColor(order.table_id).hex }} />
          Pedido #{order.id} · Mesa {order.table_id}
        </p>
        <Chip color={STATUS_COLOR[order.status] ?? "default"} size="sm">
          {order.status}
        </Chip>
      </div>

      <KdsItems items={items} onAdvance={(it, next) => setItem.mutate({ orderId: order.id, itemId: it.id, status: next })} />

      <div className="flex gap-2">
        {order.status !== "preparing" && (
          <Button variant="secondary" size="sm" className="flex-1" onPress={() => setOrder.mutate({ orderId: order.id, status: "preparing" })}>
            Preparando
          </Button>
        )}
        <Button variant="primary" size="sm" className="flex-1" onPress={() => setOrder.mutate({ orderId: order.id, status: "ready" })}>
          Listo
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onPress={() => setOrder.mutate({ orderId: order.id, status: "served" })}>
          Servido
        </Button>
      </div>
    </Card>
  );
}
