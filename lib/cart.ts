// Helpers de carrito compartidos (comensal + mesero). El precio aquí es solo para
// MOSTRAR; el backend revalida y recalcula (fuente de verdad).
import type { MenuItem } from "./types";

export type CartLine = { key: string; item: MenuItem; qty: number; optionIds: number[] };

export function cartKey(itemId: number, optionIds: number[]): string {
  return `${itemId}::${[...optionIds].sort((a, b) => a - b).join(",")}`;
}

export function hasModifiers(item: MenuItem): boolean {
  return !!item.modifier_groups?.length;
}

// Precio unitario (base + deltas). Refleja la lógica del backend:
// multi → opción no-default elegida suma; default desmarcado resta. single → elegida suma.
export function lineUnitPrice(item: MenuItem, optionIds: number[]): number {
  const sel = new Set(optionIds);
  let p = Number(item.price) || 0;
  for (const g of item.modifier_groups ?? []) {
    for (const o of g.options) {
      const on = sel.has(o.id);
      const d = Number(o.price_delta) || 0;
      if (g.selection === "multi") {
        if (on && !o.is_default) p += d;
        else if (!on && o.is_default) p -= d;
      } else if (on) {
        p += d;
      }
    }
  }
  return Math.round(p * 100) / 100;
}

// Resumen legible ("sin cebolla · +queso").
export function cartLineModLabel(item: MenuItem, optionIds: number[]): string {
  const sel = new Set(optionIds);
  const parts: string[] = [];
  for (const g of item.modifier_groups ?? []) {
    for (const o of g.options) {
      const on = sel.has(o.id);
      if (g.selection === "multi") {
        if (on && !o.is_default) parts.push(o.name);
        else if (!on && o.is_default) parts.push(`sin ${o.name}`);
      } else if (on) {
        parts.push(o.name);
      }
    }
  }
  return parts.join(" · ");
}

// Selección inicial = opciones incluidas por defecto.
export function defaultSelection(item: MenuItem): number[] {
  const s = new Set<number>();
  for (const g of item.modifier_groups ?? []) {
    if (g.selection === "single") {
      const def = g.options.find((o) => o.is_default && o.available);
      if (def) s.add(def.id);
    } else {
      for (const o of g.options) if (o.is_default && o.available) s.add(o.id);
    }
  }
  return [...s];
}

// ¿La selección respeta obligatorios + min/max de cada grupo?
export function selectionValid(item: MenuItem, selected: Set<number>): boolean {
  for (const g of item.modifier_groups ?? []) {
    const n = g.options.filter((o) => selected.has(o.id)).length;
    if (g.selection === "single") {
      if (g.min_select >= 1 ? n !== 1 : n > 1) return false;
    } else if (n < g.min_select || (g.max_select != null && n > g.max_select)) {
      return false;
    }
  }
  return true;
}
