"use client";
// Selector de modificadores + cantidad para UN ítem (modal). Reutilizable por el
// mesero (toma de pedido). El precio mostrado es referencial; el backend valida y
// recalcula. Refleja la misma lógica que la ficha del comensal.

import { Button } from "@heroui/react";
import { Check, Minus, Plus, X } from "lucide-react";
import { useState } from "react";

import { defaultSelection, lineUnitPrice, selectionValid } from "@/lib/cart";
import type { MenuItem, ModifierGroup } from "@/lib/types";

export function ModifierPicker({
  item,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (qty: number, optionIds: number[]) => void;
}) {
  const groups = item.modifier_groups ?? [];
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(() => new Set(defaultSelection(item)));

  const toggle = (g: ModifierGroup, oid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (g.selection === "single") {
        const was = next.has(oid);
        for (const o of g.options) next.delete(o.id);
        if (!was) next.add(oid);
        else if (g.min_select >= 1) next.add(oid);
      } else {
        if (next.has(oid)) next.delete(oid);
        else {
          const n = g.options.filter((o) => next.has(o.id)).length;
          if (g.max_select != null && n >= g.max_select) return prev;
          next.add(oid);
        }
      }
      return next;
    });
  };

  const optionIds = [...selected];
  const valid = selectionValid(item, selected);
  const unit = lineUnitPrice(item, optionIds);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-foreground/50 hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {groups.map((g) => {
            const n = g.options.filter((o) => selected.has(o.id)).length;
            const req = g.min_select >= 1;
            return (
              <div key={g.id}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{g.name}</p>
                  <span className={`text-[11px] ${req && n < g.min_select ? "font-semibold text-red-500" : "text-foreground/45"}`}>
                    {req ? "Obligatorio" : "Opcional"}
                    {g.selection === "multi" && g.max_select ? ` · máx ${g.max_select}` : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {g.options
                    .filter((o) => o.available)
                    .map((o) => {
                      const on = selected.has(o.id);
                      const d = Number(o.price_delta) || 0;
                      return (
                        <button
                          key={o.id}
                          onClick={() => toggle(g, o.id)}
                          className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left transition ${
                            on ? "border-foreground bg-foreground/10" : "border-foreground/15"
                          }`}
                        >
                          <span className="flex items-center gap-2.5 text-foreground">
                            <span
                              className={`grid size-5 shrink-0 place-items-center border ${
                                g.selection === "single" ? "rounded-full" : "rounded-md"
                              } ${on ? "border-foreground bg-foreground text-background" : "border-foreground/30"}`}
                            >
                              {on && <Check className="size-3.5" />}
                            </span>
                            {o.name}
                          </span>
                          {d !== 0 && (
                            <span className="shrink-0 text-sm text-foreground/60">
                              {d > 0 ? "+" : "−"}${Math.abs(d).toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-foreground/15 px-2 py-1.5">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos" className="grid size-7 place-items-center rounded-full text-foreground">
              <Minus className="size-4" />
            </button>
            <span className="w-5 text-center font-semibold text-foreground">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label="Más" className="grid size-7 place-items-center rounded-full text-foreground">
              <Plus className="size-4" />
            </button>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            isDisabled={!valid}
            onPress={() => {
              onConfirm(qty, optionIds);
              onClose();
            }}
          >
            Agregar · ${(unit * qty).toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}
