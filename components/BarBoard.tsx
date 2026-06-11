"use client";
// Tablero KDS de la BARRA: muestra en vivo las bebidas pedidas (ítems cuyo
// menú tiene station='bar') por pedido activo, y el bartender las avanza
// (preparar → lista → entregada). Espeja el KDS de Cocina pero filtrado a barra.

import { Card } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Martini } from "lucide-react";
import { useCallback, useMemo } from "react";

import { KdsItems } from "@/components/KdsItems";
import { useMenu, useOrderWithItems, useOrders, useSetItemStatus } from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { tableColor } from "@/lib/tableColor";
import type { Order } from "@/lib/types";

const ACTIVE = ["sent", "preparing", "ready"];

export function BarBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const orders = useOrders(businessId);
  const menu = useMenu(businessId);
  const barIds = useMemo(
    () => new Set((menu.data?.items ?? []).filter((i) => i.station === "bar").map((i) => i.id)),
    [menu.data],
  );

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["orders", businessId] }), [qc, businessId]);
  useRealtime("orders", businessId, refresh);
  useRealtime("order_item", businessId, refresh);

  const active = (orders.data ?? []).filter((o) => ACTIVE.includes(o.status));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-wide text-foreground/50">Tablero de barra · en vivo</p>
      {active.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((o) => (
            <BarCard key={o.id} businessId={businessId} order={o} barIds={barIds} />
          ))}
        </div>
      ) : (
        <Card className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center text-foreground/50">
          <Martini className="size-8 text-foreground/40" />
          Sin bebidas pendientes ahora mismo.
        </Card>
      )}
      {menu.isSuccess && barIds.size === 0 && (
        <p className="text-center text-[11px] text-foreground/40">
          Tip: marca tus bebidas como &ldquo;Barra&rdquo; en Setup → Menú para que caigan aquí.
        </p>
      )}
    </div>
  );
}

function BarCard({ businessId, order, barIds }: { businessId: number; order: Order; barIds: Set<number> }) {
  const detail = useOrderWithItems(businessId, order.id);
  const setItem = useSetItemStatus(businessId);

  const items = (detail.data?.items ?? []).filter((it) => it.menu_item_id != null && barIds.has(it.menu_item_id));
  if (detail.isSuccess && items.length === 0) return null;

  const c = tableColor(order.table_id);
  return (
    <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
      <p className="flex items-center gap-2 font-bold text-foreground">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
        Pedido #{order.id} · Mesa {order.table_id}
      </p>
      <KdsItems items={items} onAdvance={(it, next) => setItem.mutate({ orderId: order.id, itemId: it.id, status: next })} />
    </Card>
  );
}
