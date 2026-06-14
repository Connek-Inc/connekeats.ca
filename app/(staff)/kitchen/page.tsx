"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { KdsBoard } from "@/components/KdsBoard";
import { StockPanel } from "@/components/StockPanel";
import { useBusiness } from "@/lib/business";
import { useKds, useMenu } from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";

export default function KitchenPage() {
  const { businessId } = useBusiness();
  const qc = useQueryClient();
  const kds = useKds(businessId);
  const menu = useMenu(businessId);
  // Ítems que van a la BARRA (no se muestran en Cocina).
  const barIds = useMemo(
    () => new Set((menu.data?.items ?? []).filter((i) => i.station === "bar").map((i) => i.id)),
    [menu.data],
  );

  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["kds", businessId] }), [qc, businessId]);
  useRealtime("orders", businessId, refresh);
  useRealtime("order_item", businessId, refresh);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cocina · KDS</h1>
        <p className="text-sm text-foreground/50">
          Cursos, temporizadores y conteo del día. Toca un ítem para avanzarlo; dispara los cursos retenidos.
        </p>
      </header>

      <KdsBoard station="kitchen" orders={kds.data ?? []} barIds={barIds} />

      {businessId && <StockPanel businessId={businessId} />}
    </main>
  );
}
