// Estado del wizard de onboarding (useReducer). Mantiene el borrador editable
// del negocio: concepto, carta (desde plantilla por modo) y nº de mesas.

import { MODE_PRESETS, presetFor, type ModeKey } from "@/lib/modePresets";
import type { SeedRequestInput, Table } from "@/lib/types";

export type DraftItem = { name: string; price: number; included: boolean };
export type DraftCategory = { category: string; items: DraftItem[] };

export type WizardState = {
  step: number; // 0..3
  name: string;
  mode: ModeKey;
  menu: DraftCategory[];
  tableCount: number;
  finishing: boolean;
  created: { businessId: number; tables: Table[] } | null;
  error: string | null;
};

export const STEP_TITLES = ["Concepto", "Carta", "Mesas", "¡Listo!"];

function templateToDraft(mode: ModeKey): DraftCategory[] {
  return MODE_PRESETS[mode].menuTemplate.map((c) => ({
    category: c.category,
    items: c.items.map((it) => ({ name: it.name, price: it.price, included: true })),
  }));
}

export function initialState(): WizardState {
  return {
    step: 0,
    name: "",
    mode: "restaurant",
    menu: templateToDraft("restaurant"),
    tableCount: 6,
    finishing: false,
    created: null,
    error: null,
  };
}

export type Action =
  | { t: "mode"; mode: ModeKey }
  | { t: "name"; name: string }
  | { t: "toggleItem"; ci: number; ii: number }
  | { t: "price"; ci: number; ii: number; price: number }
  | { t: "itemName"; ci: number; ii: number; name: string }
  | { t: "addItem"; ci: number }
  | { t: "tableCount"; n: number }
  | { t: "step"; step: number }
  | { t: "finishing"; v: boolean }
  | { t: "created"; businessId: number; tables: Table[] }
  | { t: "error"; error: string | null };

const mapItem = (
  menu: DraftCategory[],
  ci: number,
  ii: number,
  fn: (it: DraftItem) => DraftItem,
): DraftCategory[] =>
  menu.map((c, i) =>
    i !== ci ? c : { ...c, items: c.items.map((it, j) => (j !== ii ? it : fn(it))) },
  );

export function reducer(s: WizardState, a: Action): WizardState {
  switch (a.t) {
    case "mode":
      // Cambiar de concepto recarga la carta plantilla de ese modo.
      return { ...s, mode: a.mode, menu: templateToDraft(a.mode) };
    case "name":
      return { ...s, name: a.name };
    case "toggleItem":
      return { ...s, menu: mapItem(s.menu, a.ci, a.ii, (it) => ({ ...it, included: !it.included })) };
    case "price":
      return { ...s, menu: mapItem(s.menu, a.ci, a.ii, (it) => ({ ...it, price: a.price })) };
    case "itemName":
      return { ...s, menu: mapItem(s.menu, a.ci, a.ii, (it) => ({ ...it, name: a.name })) };
    case "addItem":
      return {
        ...s,
        menu: s.menu.map((c, i) =>
          i !== a.ci ? c : { ...c, items: [...c.items, { name: "", price: 0, included: true }] },
        ),
      };
    case "tableCount":
      return { ...s, tableCount: a.n };
    case "step":
      return { ...s, step: a.step, error: null };
    case "finishing":
      return { ...s, finishing: a.v };
    case "created":
      return { ...s, created: { businessId: a.businessId, tables: a.tables }, step: 3, finishing: false };
    case "error":
      return { ...s, error: a.error, finishing: false };
    default:
      return s;
  }
}

export function includedCount(menu: DraftCategory[]): number {
  return menu.reduce((n, c) => n + c.items.filter((it) => it.included && it.name.trim()).length, 0);
}

/** Borrador → payload del endpoint /seed (ítems quedan con available_in = modo). */
export function buildSeedPayload(s: WizardState): SeedRequestInput {
  const preset = presetFor(s.mode);
  const categories = s.menu
    .map((c, i) => ({
      name: c.category,
      sort_order: i,
      items: c.items
        .filter((it) => it.included && it.name.trim())
        .map((it) => ({ name: it.name.trim(), price: Number(it.price) || 0, available_in: s.mode })),
    }))
    .filter((c) => c.items.length > 0);
  return {
    categories,
    tables: {
      count: s.tableCount,
      label_prefix: preset.tableDefaults.labelPrefix,
      capacity: preset.tableDefaults.capacity,
    },
  };
}
