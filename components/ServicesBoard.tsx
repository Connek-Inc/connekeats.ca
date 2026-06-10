"use client";
// Módulo Servicios: bandeja en vivo de solicitudes del comensal (llama mesero /
// pide algo / pide la cuenta). Reusa service_requests + ack. El staff atiende
// con Voy / Hecho.

import { Button, Card } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ConciergeBell, CreditCard, Hand, type LucideIcon } from "lucide-react";
import { useCallback } from "react";

import { useAckRequest, useServiceRequests, useTables } from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { tableColor } from "@/lib/tableColor";
import type { ServiceRequest } from "@/lib/types";

const LABEL: Record<string, string> = {
  call_waiter: "Llama al mesero",
  request_item: "Pide algo",
  request_bill: "Pide la cuenta",
};
const ICON: Record<string, LucideIcon> = {
  call_waiter: ConciergeBell,
  request_item: Hand,
  request_bill: CreditCard,
};

export function ServicesBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const requests = useServiceRequests(businessId);
  const tables = useTables(businessId);
  const ack = useAckRequest(businessId);

  const refresh = useCallback(
    () => qc.invalidateQueries({ queryKey: ["service-requests", businessId] }),
    [qc, businessId],
  );
  useRealtime("service_request", businessId, refresh);

  const open = (requests.data ?? []).filter((r) => r.status !== "done");
  const labelOf = (id: number) => tables.data?.find((t) => t.id === id)?.label ?? `Mesa ${id}`;
  const text = (r: ServiceRequest) => {
    const extra = (r.payload as { text?: string } | null)?.text;
    return LABEL[r.type] + (extra ? ` — ${extra}` : "");
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wide text-foreground/50">Solicitudes en vivo · {open.length}</p>
      {open.length ? (
        open.map((r) => {
          const c = tableColor(r.table_id);
          const Icon = ICON[r.type] ?? Bell;
          return (
            <Card
              key={r.id}
              style={{ borderLeftColor: c.hex, borderLeftWidth: 5, borderLeftStyle: "solid" }}
              className={`flex flex-row items-center justify-between rounded-3xl p-4 ${
                r.status === "open" ? "bg-foreground/[0.07]" : "glass"
              }`}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
                  {labelOf(r.table_id)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-foreground/65">
                  <Icon className="size-4" /> {text(r)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
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
        <Card className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center text-foreground/50">
          <Bell className="size-8 text-foreground/40" />
          Sin solicitudes pendientes.
        </Card>
      )}
    </div>
  );
}
