"use client";
// Módulo Zona VIP: vista en vivo del salón VIP (mesas de una zona llamada "VIP")
// + atención prioritaria de sus solicitudes. Reusa floors/tables/service_requests.

import { Button, Card } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useCallback, useMemo } from "react";

import { FloorMap } from "@/components/FloorMap";
import { useAckRequest, useFloors, useServiceRequests, useTables } from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { tableColor } from "@/lib/tableColor";

const TABLE_STATUS: Record<string, string> = {
  available: "Libre",
  occupied: "Ocupada",
  reserved: "Reservada",
  cleaning: "Limpieza",
  bill_requested: "Cuenta",
};

export function VipBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const floors = useFloors(businessId);
  const tables = useTables(businessId);
  const requests = useServiceRequests(businessId);
  const ack = useAckRequest(businessId);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["service-requests", businessId] });
    qc.invalidateQueries({ queryKey: ["tables", businessId] });
  }, [qc, businessId]);
  useRealtime("service_request", businessId, refresh);
  useRealtime("tables", businessId, refresh);

  const vipFloorIds = useMemo(
    () => new Set((floors.data ?? []).filter((f) => f.name.toLowerCase().includes("vip")).map((f) => f.id)),
    [floors.data],
  );
  const vipTables = (tables.data ?? []).filter((t) => t.floor_id != null && vipFloorIds.has(t.floor_id));
  const vipTableIds = new Set(vipTables.map((t) => t.id));
  const openReqs = (requests.data ?? []).filter((r) => r.status !== "done" && vipTableIds.has(r.table_id));
  const calledIds = new Set(openReqs.map((r) => r.table_id));
  const labelOf = (id: number) => tables.data?.find((t) => t.id === id)?.label ?? `Mesa ${id}`;

  if (floors.isSuccess && vipFloorIds.size === 0) {
    return (
      <Card className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
        <Star className="size-10 text-foreground/40" />
        <h2 className="text-lg font-semibold text-foreground">Define tu zona VIP</h2>
        <p className="text-foreground/55">
          En <b>Setup → Zonas</b> crea una zona llamada <b>VIP</b> y asigna ahí tus mesas premium. Aparecerán aquí en vivo.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Salón VIP · {vipTables.length} mesas</p>
        {vipTables.length ? (
          <FloorMap tables={vipTables} calledIds={calledIds} statusLabel={(t) => TABLE_STATUS[t.status] ?? t.status} />
        ) : (
          <p className="text-sm text-foreground/40">Asigna mesas a la zona VIP en Setup → Zonas.</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Atención prioritaria · {openReqs.length}</p>
        {openReqs.length ? (
          openReqs.map((r) => {
            const c = tableColor(r.table_id);
            return (
              <Card
                key={r.id}
                style={{ borderLeftColor: c.hex, borderLeftWidth: 5, borderLeftStyle: "solid" }}
                className="flex flex-row items-center justify-between rounded-3xl bg-foreground/[0.06] p-4"
              >
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
                  {labelOf(r.table_id)}
                </p>
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
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-foreground/40">Sin solicitudes VIP ahora.</p>
        )}
      </section>
    </div>
  );
}
