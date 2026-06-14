"use client";
// KDS profesional (cocina/barra): panel "all-day" (conteo total por platillo) +
// tickets con TEMPORIZADOR (color por antigüedad), agrupados por CURSO (coursing),
// con disparo de cursos retenidos, "listo" por curso, y bump/recall del ticket.
// La lógica de transición vive en el backend (/orders/kds-action); aquí solo UI.

import { Card } from "@heroui/react";
import { AlarmClock, Check, Flame, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { modifierLabel } from "@/components/KdsItems";
import { useKdsAction, useSetItemStatus, useSetOrderStatus } from "@/lib/hooks";
import { tableColor } from "@/lib/tableColor";
import type { Order, OrderItem } from "@/lib/types";

const COURSES: { key: string; label: string }[] = [
  { key: "starter", label: "Entradas" },
  { key: "main", label: "Platos fuertes" },
  { key: "dessert", label: "Postres" },
  { key: "drink", label: "Bebidas" },
  { key: "", label: "Otros" },
];
const COURSE_LABEL: Record<string, string> = Object.fromEntries(COURSES.map((c) => [c.key, c.label]));

const NEXT: Record<string, string> = { queued: "preparing", preparing: "ready", ready: "served" };
const TONE: Record<string, string> = {
  queued: "bg-foreground/[0.04] border-foreground/10",
  preparing: "bg-foreground/10 border-foreground/25",
  ready: "bg-foreground/20 border-foreground/50",
  served: "bg-foreground/[0.02] border-foreground/5 text-foreground/40",
};

function minsSince(iso?: string | null, now = Date.now()): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now - t) / 60000));
}
function ageStyle(min: number) {
  if (min >= 15) return "ring-red-500/60 text-red-500";
  if (min >= 8) return "ring-amber-500/60 text-amber-500";
  return "ring-foreground/15 text-foreground/50";
}

export function KdsBoard({
  station,
  orders,
  barIds,
}: {
  station: "kitchen" | "bar";
  orders: Order[];
  barIds: Set<number>;
}) {
  // Reloj para los temporizadores (tick cada 15s).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const forStation = (it: OrderItem) => {
    const isBar = it.menu_item_id != null && barIds.has(it.menu_item_id);
    return station === "bar" ? isBar : !isBar;
  };

  // Tickets con al menos un ítem (de esta estación) sin servir.
  const tickets = orders
    .map((o) => ({ order: o, items: (o.items ?? []).filter(forStation) }))
    .filter((t) => t.items.some((it) => it.status !== "served"));

  // All-day: total por platillo de lo DISPARADO y pendiente (queued/preparing).
  const allday = new Map<string, { name: string; qty: number }>();
  for (const t of tickets) {
    for (const it of t.items) {
      if (it.fired === false) continue;
      if (it.status !== "queued" && it.status !== "preparing") continue;
      const key = String(it.menu_item_id ?? it.name_snapshot);
      const cur = allday.get(key) ?? { name: it.name_snapshot, qty: 0 };
      cur.qty += it.qty;
      allday.set(key, cur);
    }
  }
  const alldayList = [...allday.values()].sort((a, b) => b.qty - a.qty);

  return (
    <div className="flex flex-col gap-4">
      {alldayList.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/45">
            Total a preparar (all-day)
          </p>
          <div className="flex flex-wrap gap-2">
            {alldayList.map((a) => (
              <span
                key={a.name}
                className="flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] px-3 py-1 text-sm text-foreground"
              >
                <span className="font-bold">{a.qty}×</span> {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {tickets.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tickets.map((t) => (
            <KdsTicket key={t.order.id} order={t.order} items={t.items} now={now} />
          ))}
        </div>
      ) : (
        <p className="text-foreground/40">Sin pedidos activos.</p>
      )}
    </div>
  );
}

function KdsTicket({ order, items, now }: { order: Order; items: OrderItem[]; now: number }) {
  const kds = useKdsAction(order.business_id);
  const setItem = useSetItemStatus(order.business_id);
  const setOrder = useSetOrderStatus(order.business_id);

  const visible = items.filter((it) => it.status !== "served");
  const age = minsSince(order.created_at, now);

  // Agrupar por curso, en orden de cocina.
  const byCourse = new Map<string, OrderItem[]>();
  for (const it of visible) {
    const k = it.course ?? "";
    (byCourse.get(k) ?? byCourse.set(k, []).get(k)!).push(it);
  }
  const courseBlocks = COURSES.filter((c) => byCourse.has(c.key)).map((c) => ({
    ...c,
    its: byCourse.get(c.key)!,
  }));

  const allReady = visible.length > 0 && visible.every((it) => it.status === "ready");

  return (
    <Card className="glass flex flex-col gap-2.5 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tableColor(order.table_id).hex }} />
          #{order.id} · Mesa {order.table_id}
        </p>
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-2 ${ageStyle(age)}`}>
          <AlarmClock className="size-3.5" /> {age}m
        </span>
      </div>

      {courseBlocks.map((c) => {
        const held = c.its.every((it) => it.fired === false);
        return (
          <div key={c.key} className="flex flex-col gap-1.5">
            {(courseBlocks.length > 1 || c.key) && (
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
                  {COURSE_LABEL[c.key] ?? "Otros"}
                  {held && <span className="ml-1 normal-case text-amber-500">· retenido</span>}
                </span>
                {held ? (
                  <button
                    onClick={() => kds.mutate({ orderId: order.id, action: "fire", scope: "course", value: c.key })}
                    className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 transition hover:bg-amber-500/25"
                  >
                    <Flame className="size-3" /> Disparar
                  </button>
                ) : (
                  <button
                    onClick={() => kds.mutate({ orderId: order.id, action: "ready", scope: "course", value: c.key })}
                    className="flex items-center gap-1 text-[11px] font-semibold text-foreground/50 transition hover:text-foreground"
                  >
                    Listo <Check className="size-3" />
                  </button>
                )}
              </div>
            )}
            {c.its.map((it) => {
              const mods = modifierLabel(it.modifiers);
              const held1 = it.fired === false;
              return (
                <button
                  key={it.id}
                  disabled={held1}
                  onClick={() => NEXT[it.status] && setItem.mutate({ orderId: order.id, itemId: it.id, status: NEXT[it.status] })}
                  className={`flex items-start justify-between gap-2 rounded-2xl border px-3 py-2 text-left ${held1 ? "border-dashed border-foreground/15 opacity-50" : TONE[it.status]}`}
                >
                  <span className="flex flex-col text-foreground">
                    <span className="flex items-center gap-1.5">
                      {it.qty}× {it.name_snapshot}
                      {(it.round ?? 1) > 1 && (
                        <span className="rounded-full bg-foreground/15 px-1.5 text-[9px] font-bold">R{it.round}</span>
                      )}
                    </span>
                    {(mods || it.notes) && (
                      <span className="text-xs font-medium text-foreground/60">
                        {mods}
                        {mods && it.notes ? " · " : ""}
                        {it.notes ?? ""}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-foreground/45">{held1 ? "espera" : it.status}</span>
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="mt-1 flex gap-2">
        <button
          onClick={() => {
            kds.mutate({ orderId: order.id, action: "ready", scope: "order" });
            setOrder.mutate({ orderId: order.id, status: "ready" }); // avisa al mesero
          }}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-bold transition ${allReady ? "bg-foreground/15 text-foreground/60" : "bg-foreground text-background"}`}
        >
          Todo listo
        </button>
        <button
          onClick={() => {
            kds.mutate({ orderId: order.id, action: "served", scope: "order" });
            setOrder.mutate({ orderId: order.id, status: "served" });
          }}
          className="flex-1 rounded-full border border-foreground/20 px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-foreground/5"
        >
          Bump
        </button>
        <button
          onClick={() => kds.mutate({ orderId: order.id, action: "recall", scope: "order" })}
          aria-label="Recall"
          title="Recall (deshacer)"
          className="grid place-items-center rounded-full border border-foreground/20 px-3 text-foreground/60 transition hover:bg-foreground/5"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </Card>
  );
}
