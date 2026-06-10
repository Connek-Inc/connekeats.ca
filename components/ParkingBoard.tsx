"use client";
// Módulo Parking / Valet (100% funcional): registra vehículos en custodia,
// los lista, y el valet los marca "entregado". Historial de entregados recientes.

import { Button, Card, Input, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Car, Check, KeyRound, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import {
  useCreateParkingTicket,
  useDeleteParkingTicket,
  useParkingTickets,
  useUpdateParkingTicket,
} from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { useToast } from "@/lib/toast";

function timeOf(s?: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ParkingBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["parking", businessId] }), [qc, businessId]);
  useRealtime("parking_ticket", businessId, refresh);
  const tickets = useParkingTickets(businessId);
  const create = useCreateParkingTicket(businessId);
  const update = useUpdateParkingTicket(businessId);
  const del = useDeleteParkingTicket(businessId);
  const { show } = useToast();
  const [plate, setPlate] = useState("");
  const [customer, setCustomer] = useState("");
  const [spot, setSpot] = useState("");

  const all = tickets.data ?? [];
  const parked = all.filter((t) => t.status === "parked");
  const retrieved = all.filter((t) => t.status === "retrieved").slice(0, 15);

  const register = async () => {
    if (!plate.trim()) return show("Escribe la placa", "error");
    try {
      await create.mutateAsync({
        plate: plate.trim(),
        customer: customer.trim() || null,
        spot: spot.trim() || null,
      });
      setPlate("");
      setCustomer("");
      setSpot("");
      show("Vehículo registrado", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo registrar", "error");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Registrar */}
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Registrar vehículo</p>
        <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Placa (ej: ABC-123)" fullWidth />
        <div className="flex gap-2">
          <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Cliente (opcional)" fullWidth />
          <Input value={spot} onChange={(e) => setSpot(e.target.value)} placeholder="Lugar" className="w-28" />
        </div>
        <Button variant="primary" isDisabled={create.isPending} onPress={register}>
          <span className="flex items-center justify-center gap-2">
            <Car className="size-4" /> Registrar
          </span>
        </Button>
      </section>

      {/* En custodia */}
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">En custodia · {parked.length}</p>
        {tickets.isLoading ? (
          <Spinner color="accent" size="sm" />
        ) : parked.length ? (
          parked.map((t) => (
            <Card key={t.id} className="glass flex flex-row items-center justify-between rounded-2xl p-3">
              <div className="min-w-0">
                <p className="text-lg font-bold tracking-wide text-foreground">{t.plate}</p>
                <p className="truncate text-xs text-foreground/50">
                  {[t.customer, t.spot ? `Lugar ${t.spot}` : null, timeOf(t.created_at)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-full"
                  isDisabled={update.isPending}
                  onPress={() =>
                    update.mutate(
                      { id: t.id, status: "retrieved" },
                      { onSuccess: () => show("Entregado", "success"), onError: () => show("No se pudo", "error") },
                    )
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="size-4" /> Entregar
                  </span>
                </Button>
                <button aria-label={`Borrar ${t.plate}`} onClick={() => del.mutate(t.id)} className="text-foreground/40 transition hover:text-foreground">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-foreground/40">No hay vehículos en custodia.</p>
        )}
      </section>

      {/* Entregados recientes */}
      {retrieved.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Entregados recientes</p>
          {retrieved.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-2xl border border-foreground/10 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-foreground/70">
                <Check className="size-4 text-foreground/50" /> {t.plate}
                <span className="text-foreground/40">{timeOf(t.retrieved_at)}</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => update.mutate({ id: t.id, status: "parked" })}
                  className="text-xs text-foreground/50 hover:text-foreground"
                >
                  Reingresar
                </button>
                <button aria-label={`Borrar ${t.plate}`} onClick={() => del.mutate(t.id)} className="text-foreground/40 transition hover:text-foreground">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
