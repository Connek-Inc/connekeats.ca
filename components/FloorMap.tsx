"use client";
// Mapa visual del salón: cuadrícula que coloca cada mesa en su posición
// (pos_x = columna, pos_y = fila). Cada mesa con su color; resalta las llamadas
// y la seleccionada. Reutilizable (mesero = solo ver; dueño = arreglar).

import { Bell } from "lucide-react";

import { tableColor } from "@/lib/tableColor";
import type { Table } from "@/lib/types";

const COLS = 6;

export function FloorMap({
  tables,
  calledIds,
  selectedId,
  onSelect,
  statusLabel,
}: {
  tables: Table[];
  calledIds?: Set<number>;
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  statusLabel?: (t: Table) => string;
}) {
  // Layout SIN solapamientos: respeta pos_x/pos_y si la celda está libre; si está
  // ocupada (p. ej. mesas sembradas todas en 0,0) corre la mesa a la siguiente
  // celda libre. Así el salón nunca se encima y respeta el acomodo manual.
  const placed = new Set<string>();
  const layout = tables.map((t, i) => {
    let col = t.pos_x ?? i % COLS;
    let row = t.pos_y ?? Math.floor(i / COLS);
    if (col < 0 || col >= COLS) col = i % COLS;
    if (row < 0) row = 0;
    while (placed.has(`${col},${row}`)) {
      col += 1;
      if (col >= COLS) {
        col = 0;
        row += 1;
      }
    }
    placed.add(`${col},${row}`);
    return { t, col, row };
  });

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(56px, 84px))` }}
      >
        {layout.map(({ t, col, row }) => {
          const c = tableColor(t.id);
          const called = calledIds?.has(t.id);
          const sel = selectedId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect?.(t.id)}
              style={{
                gridColumnStart: col + 1,
                gridRowStart: row + 1,
                borderColor: c.hex,
                boxShadow: called
                  ? `0 0 0 2px ${c.hex}`
                  : sel
                    ? "0 0 0 2px var(--foreground)"
                    : undefined,
              }}
              className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border-2 bg-foreground/[0.04] p-1 text-center transition active:scale-95"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
              <span className="text-[11px] font-bold leading-tight text-foreground">{t.label}</span>
              {called ? (
                <Bell className="size-3 animate-pulse text-foreground" />
              ) : statusLabel ? (
                <span className="text-[8px] uppercase leading-none text-foreground/45">{statusLabel(t)}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
