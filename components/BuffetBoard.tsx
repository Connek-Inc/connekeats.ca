"use client";
// Módulo Buffet: estaciones (ensaladas, postres, parrilla…) y su reposición.
// Toca el estado para ciclar OK → Por reponer → Vacía.

import { Button, Card, Input, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Soup, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import {
  useBuffetStations,
  useCreateBuffetStation,
  useDeleteBuffetStation,
  useUpdateBuffetStation,
} from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { useToast } from "@/lib/toast";

const NEXT: Record<string, "ok" | "low" | "empty"> = { ok: "low", low: "empty", empty: "ok" };
const META: Record<string, { label: string; cls: string }> = {
  ok: { label: "OK", cls: "bg-foreground/[0.06] text-foreground/70 border-foreground/15" },
  low: { label: "Por reponer", cls: "bg-foreground/20 text-foreground border-foreground/40" },
  empty: { label: "Vacía", cls: "bg-foreground text-background border-foreground" },
};

export function BuffetBoard({ businessId }: { businessId: number }) {
  const qc = useQueryClient();
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["buffet", businessId] }), [qc, businessId]);
  useRealtime("buffet_station", businessId, refresh);
  const stations = useBuffetStations(businessId);
  const create = useCreateBuffetStation(businessId);
  const update = useUpdateBuffetStation(businessId);
  const del = useDeleteBuffetStation(businessId);
  const { show } = useToast();
  const [name, setName] = useState("");
  const list = stations.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Nueva estación</p>
        <div className="flex items-stretch gap-2">
          <Input fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ensaladas, Postres, Parrilla" />
          <Button
            variant="primary"
            isDisabled={create.isPending}
            onPress={async () => {
              if (!name.trim()) return show("Escribe un nombre", "error");
              await create.mutateAsync({ name: name.trim() });
              setName("");
              show("Estación creada", "success");
            }}
          >
            Añadir
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Estaciones · {list.length}</p>
        {stations.isLoading ? (
          <Spinner color="accent" size="sm" />
        ) : list.length ? (
          list.map((s) => {
            const meta = META[s.status] ?? META.ok;
            return (
              <Card key={s.id} className="glass flex flex-row items-center justify-between rounded-2xl p-3">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Soup className="size-4 text-foreground/60" />
                  {s.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update.mutate({ id: s.id, status: NEXT[s.status] ?? "ok" })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${meta.cls}`}
                  >
                    {meta.label}
                  </button>
                  <button aria-label={`Borrar ${s.name}`} onClick={() => del.mutate(s.id)} className="text-foreground/40 transition hover:text-foreground">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-foreground/40">Crea tus estaciones del buffet (ensaladas, postres, parrilla…).</p>
        )}
      </section>

      <p className="text-center text-[11px] text-foreground/40">Toca el estado para ciclarlo: OK → Por reponer → Vacía.</p>
    </div>
  );
}
