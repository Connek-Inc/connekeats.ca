"use client";
// Tablero KDS de la BARRA: bebidas (ítems con station='bar') de los pedidos
// activos, con el mismo KDS pro de cocina (cursos, temporizadores, all-day,
// disparo, bump/recall) pero filtrado a barra. El bartender las avanza.

import { Card } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Martini } from "lucide-react";
import { useCallback, useMemo } from "react";

import { KdsBoard } from "@/components/KdsBoard";
import { useKds, useMenu } from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";

export function BarBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const kds = useKds(businessId);
  const menu = useMenu(businessId);
  const barIds = useMemo(
    () => new Set((menu.data?.items ?? []).filter((i) => i.station === "bar").map((i) => i.id)),
    [menu.data],
  );

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["kds", businessId] }), [qc, businessId]);
  useRealtime("orders", businessId, refresh);
  useRealtime("order_item", businessId, refresh);

  const hasBarItems = (kds.data ?? []).some((o) =>
    (o.items ?? []).some((it) => it.menu_item_id != null && barIds.has(it.menu_item_id) && it.status !== "served"),
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-wide text-foreground/50">Tablero de barra · en vivo</p>
      {hasBarItems ? (
        <KdsBoard businessId={businessId} station="bar" orders={kds.data ?? []} barIds={barIds} />
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
