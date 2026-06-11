"use client";
// Inventario / stock de cocina: insumos con cantidad, unidad y umbral bajo.
// El personal de cocina ajusta existencias (+/−) y ve alertas de reposición.

import { Button, Card, Input } from "@heroui/react";
import { Minus, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useAdjustStock, useCreateStock, useDeleteStock, useStock } from "@/lib/hooks";

export function StockPanel({ businessId }: { businessId: number }) {
  const stock = useStock(businessId);
  const create = useCreateStock(businessId);
  const adjust = useAdjustStock(businessId);
  const del = useDeleteStock(businessId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("");
  const [low, setLow] = useState("");

  const items = stock.data ?? [];
  const lowCount = items.filter(
    (i) => Number(i.low_threshold) > 0 && Number(i.qty) <= Number(i.low_threshold),
  ).length;

  const addItem = () => {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), qty: Number(qty) || 0, unit: unit || undefined, low_threshold: Number(low) || 0 },
      {
        onSuccess: () => {
          setName("");
          setQty("");
          setUnit("");
          setLow("");
        },
      },
    );
  };

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-2 flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/50">
          <Package className="size-4" /> Inventario / stock
          {lowCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
              {lowCount} bajo
            </span>
          )}
        </span>
        <span className="text-xs text-foreground/40">{open ? "ocultar" : "ver"}</span>
      </button>

      {open && (
        <Card className="glass flex flex-col gap-3 rounded-3xl p-4">
          <div className="grid grid-cols-4 gap-2">
            <Input className="col-span-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Insumo (ej. Tomate)" />
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Cant." />
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unidad" />
          </div>
          <div className="flex gap-2">
            <Input type="number" value={low} onChange={(e) => setLow(e.target.value)} placeholder="Umbral bajo (alerta)" />
            <Button variant="primary" isDisabled={create.isPending} onPress={addItem}>
              <span className="flex items-center gap-1">
                <Plus className="size-4" /> Añadir
              </span>
            </Button>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-foreground/10 pt-2">
            {items.length ? (
              items.map((it) => {
                const lowFlag = Number(it.low_threshold) > 0 && Number(it.qty) <= Number(it.low_threshold);
                return (
                  <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5 text-foreground/80">
                      {it.name}
                      {lowFlag && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">bajo</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <button onClick={() => adjust.mutate({ id: it.id, delta: -1 })} aria-label={`Restar ${it.name}`}>
                        <Minus className="size-4 text-foreground/40 transition hover:text-foreground" />
                      </button>
                      <span className="w-20 text-center font-mono font-semibold tabular-nums">
                        {Number(it.qty)} {it.unit || ""}
                      </span>
                      <button onClick={() => adjust.mutate({ id: it.id, delta: 1 })} aria-label={`Sumar ${it.name}`}>
                        <Plus className="size-4 text-foreground/40 transition hover:text-foreground" />
                      </button>
                      <button onClick={() => del.mutate(it.id)} aria-label={`Eliminar ${it.name}`}>
                        <Trash2 className="size-3.5 text-foreground/30 transition hover:text-rose-500" />
                      </button>
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-foreground/40">Sin insumos. Añade los que uses para tus recetas.</p>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}
