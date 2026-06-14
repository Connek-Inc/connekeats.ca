"use client";
// Lista de ítems de un pedido para los tableros KDS (cocina y barra).
// Agrupa por RONDA (tanda) para que, cuando el comensal pide por tandas, el
// personal vea separado lo nuevo de lo ya pedido y NO repita ítems:
//  - los ítems SERVIDOS (ya entregados) se ocultan,
//  - cada ronda lleva su encabezado ("Ronda N"),
//  - la última ronda con algo pendiente se resalta con "NUEVO".

import type { OrderItem, OrderItemModifier } from "@/lib/types";

// Texto corto de los modificadores para la cocina/barra: "sin cebolla · +queso".
export function modifierLabel(mods?: OrderItemModifier[]): string {
  if (!mods?.length) return "";
  return mods
    .map((m) => (m.kind === "remove" ? `sin ${m.option_name}` : m.option_name))
    .join(" · ");
}

const TONE: Record<string, string> = {
  queued: "bg-foreground/[0.04] border-foreground/10",
  preparing: "bg-foreground/10 border-foreground/25",
  ready: "bg-foreground/20 border-foreground/50",
  served: "bg-foreground/[0.02] border-foreground/5 text-foreground/40",
};
const NEXT: Record<string, string> = { queued: "preparing", preparing: "ready", ready: "served" };

export function KdsItems({
  items,
  onAdvance,
}: {
  items: OrderItem[];
  onAdvance: (item: OrderItem, next: string) => void;
}) {
  // Oculta lo ya SERVIDO (entregado): no debe re-mostrarse al llegar una tanda nueva.
  const visible = items.filter((it) => it.status !== "served");

  // Agrupa por ronda.
  const map = new Map<number, OrderItem[]>();
  for (const it of visible) {
    const r = it.round ?? 1;
    const arr = map.get(r);
    if (arr) arr.push(it);
    else map.set(r, [it]);
  }
  const rounds = [...map.entries()].sort((a, b) => a[0] - b[0]);
  if (rounds.length === 0) return null;
  const maxRound = rounds[rounds.length - 1][0];
  const multi = rounds.length > 1;

  return (
    <div className="flex flex-col gap-2.5">
      {rounds.map(([round, its]) => {
        const pending = its.some((it) => it.status === "queued" || it.status === "preparing");
        const isNew = multi && round === maxRound && pending;
        return (
          <div
            key={round}
            className={`flex flex-col gap-1.5 ${multi ? "rounded-2xl p-1.5" : ""} ${
              isNew ? "bg-foreground/[0.04] ring-2 ring-foreground/40" : ""
            }`}
          >
            {multi && (
              <p className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
                Ronda {round}
                {isNew && (
                  <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[9px] font-bold text-background">NUEVO</span>
                )}
                {!pending && <span className="font-normal normal-case text-foreground/30">· hecho</span>}
              </p>
            )}
            {its.map((it) => {
              const mods = modifierLabel(it.modifiers);
              return (
                <button
                  key={it.id}
                  disabled={it.status === "served"}
                  onClick={() => NEXT[it.status] && onAdvance(it, NEXT[it.status])}
                  className={`flex items-start justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left ${TONE[it.status]}`}
                >
                  <span className="flex flex-col text-foreground">
                    <span>
                      {it.qty}× {it.name_snapshot}
                    </span>
                    {(mods || it.notes) && (
                      <span className="text-xs font-medium text-foreground/60">
                        {mods}
                        {mods && it.notes ? " · " : ""}
                        {it.notes ?? ""}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-foreground/50">{it.status}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
