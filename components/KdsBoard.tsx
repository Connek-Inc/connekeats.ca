"use client";
// KDS profesional (cocina/barra): panel "all-day" (con 86/agotado), tickets con
// TEMPORIZADOR (color por antigüedad vs tiempo de prep), agrupados por CURSO
// (coursing) con disparo de retenidos, listo/recall por ítem y por curso, RUSH,
// alerta SONORA al envejecer, y ver servidos. La lógica de transición vive en el
// backend (/orders/kds-action); aquí solo UI.

import { Card } from "@heroui/react";
import { AlarmClock, Ban, Check, Eye, EyeOff, Flame, RotateCcw, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { modifierLabel } from "@/components/KdsItems";
import { useKdsAction, useSetItemStatus, useSetOrderPriority, useSetOrderStatus, useToggleItemAvailability } from "@/lib/hooks";
import { beep } from "@/lib/notify";
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
// Objetivo de tiempo del ticket = mayor prep_minutes de lo disparado y pendiente.
function ticketTarget(items: OrderItem[]): number | null {
  const m = Math.max(
    0,
    ...items
      .filter((it) => it.fired !== false && (it.status === "queued" || it.status === "preparing"))
      .map((it) => it.prep_minutes ?? 0),
  );
  return m > 0 ? m : null;
}
function thresholds(target: number | null) {
  return { amber: target ?? 8, red: target ? Math.round(target * 1.5) : 15 };
}
function ageStyle(min: number, target: number | null) {
  const { amber, red } = thresholds(target);
  if (min >= red) return "ring-red-500/60 text-red-500";
  if (min >= amber) return "ring-amber-500/60 text-amber-500";
  return "ring-foreground/15 text-foreground/50";
}

export function KdsBoard({
  businessId,
  station,
  orders,
  barIds,
}: {
  businessId: number;
  station: "kitchen" | "bar";
  orders: Order[];
  barIds: Set<number>;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [showServed, setShowServed] = useState(false);
  const toggle86 = useToggleItemAvailability(businessId);
  const alerted = useRef<Set<number>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const forStation = (it: OrderItem) => {
    const isBar = it.menu_item_id != null && barIds.has(it.menu_item_id);
    return station === "bar" ? isBar : !isBar;
  };

  // Tickets (rush primero, luego FIFO).
  const tickets = orders
    .map((o) => ({ order: o, items: (o.items ?? []).filter(forStation) }))
    .filter((t) => t.items.some((it) => it.status !== "served"))
    .sort((a, b) => Number(b.order.priority ?? false) - Number(a.order.priority ?? false) || a.order.id - b.order.id);

  // Alerta sonora cuando un ticket cruza a "rojo" (una vez).
  useEffect(() => {
    for (const t of tickets) {
      const late = minsSince(t.order.created_at, now) >= thresholds(ticketTarget(t.items)).red;
      if (late && !alerted.current.has(t.order.id)) {
        alerted.current.add(t.order.id);
        beep();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  // All-day: total por platillo disparado y pendiente (con su menu_item_id para el 86).
  const allday = new Map<string, { name: string; qty: number; menuId: number | null }>();
  for (const t of tickets) {
    for (const it of t.items) {
      if (it.fired === false) continue;
      if (it.status !== "queued" && it.status !== "preparing") continue;
      const key = String(it.menu_item_id ?? it.name_snapshot);
      const cur = allday.get(key) ?? { name: it.name_snapshot, qty: 0, menuId: it.menu_item_id ?? null };
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
            Total a preparar (all-day) · toca 86 para agotar
          </p>
          <div className="flex flex-wrap gap-2">
            {alldayList.map((a) => (
              <span
                key={a.name}
                className="flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/[0.04] py-1 pl-3 pr-1 text-sm text-foreground"
              >
                <span className="font-bold">{a.qty}×</span> {a.name}
                {a.menuId != null && (
                  <button
                    onClick={() => toggle86.mutate({ itemId: a.menuId!, available: false })}
                    title={`Marcar "${a.name}" como agotado (86)`}
                    aria-label={`86 ${a.name}`}
                    className="ml-0.5 grid size-5 place-items-center rounded-full text-foreground/40 transition hover:bg-red-500/15 hover:text-red-500"
                  >
                    <Ban className="size-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground/45">{tickets.length} tickets</p>
        <button
          onClick={() => setShowServed((v) => !v)}
          className="flex items-center gap-1 text-xs text-foreground/50 transition hover:text-foreground"
        >
          {showServed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {showServed ? "Ocultar servidos" : "Ver servidos"}
        </button>
      </div>

      {tickets.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tickets.map((t) => (
            <KdsTicket key={t.order.id} order={t.order} items={t.items} now={now} showServed={showServed} />
          ))}
        </div>
      ) : (
        <p className="text-foreground/40">Sin pedidos activos.</p>
      )}
    </div>
  );
}

function KdsTicket({ order, items, now, showServed }: { order: Order; items: OrderItem[]; now: number; showServed: boolean }) {
  const kds = useKdsAction(order.business_id);
  const setItem = useSetItemStatus(order.business_id);
  const setOrder = useSetOrderStatus(order.business_id);
  const setPriority = useSetOrderPriority(order.business_id);

  const visible = showServed ? items : items.filter((it) => it.status !== "served");
  const target = ticketTarget(items);
  const age = minsSince(order.created_at, now);
  const rush = !!order.priority;

  const byCourse = new Map<string, OrderItem[]>();
  for (const it of visible) {
    const k = it.course ?? "";
    (byCourse.get(k) ?? byCourse.set(k, []).get(k)!).push(it);
  }
  const courseBlocks = COURSES.filter((c) => byCourse.has(c.key)).map((c) => ({ ...c, its: byCourse.get(c.key)! }));

  return (
    <Card className={`glass flex flex-col gap-2.5 rounded-3xl p-4 ${rush ? "ring-2 ring-red-500/60" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tableColor(order.table_id).hex }} />
          #{order.id} · Mesa {order.table_id}
          {rush && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">RUSH</span>}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPriority.mutate({ orderId: order.id, priority: !rush })}
            title={rush ? "Quitar rush" : "Marcar rush (urgente)"}
            aria-label="Rush"
            className={`grid size-6 place-items-center rounded-full transition ${rush ? "text-red-500" : "text-foreground/35 hover:text-foreground"}`}
          >
            <Zap className={`size-4 ${rush ? "fill-red-500" : ""}`} />
          </button>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-2 ${ageStyle(age, target)}`}>
            <AlarmClock className="size-3.5" /> {age}m{target ? `/${target}` : ""}
          </span>
        </div>
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
              const canRecall = it.status === "preparing" || it.status === "ready" || it.status === "served";
              return (
                <div
                  key={it.id}
                  className={`flex items-start justify-between gap-2 rounded-2xl border px-3 py-2 ${held1 ? "border-dashed border-foreground/15 opacity-50" : TONE[it.status]}`}
                >
                  <button
                    disabled={held1}
                    onClick={() => NEXT[it.status] && setItem.mutate({ orderId: order.id, itemId: it.id, status: NEXT[it.status] })}
                    className="flex min-w-0 flex-1 flex-col text-left text-foreground"
                  >
                    <span className="flex items-center gap-1.5">
                      {it.qty}× {it.name_snapshot}
                      {(it.round ?? 1) > 1 && <span className="rounded-full bg-foreground/15 px-1.5 text-[9px] font-bold">R{it.round}</span>}
                    </span>
                    {(mods || it.notes) && (
                      <span className="text-xs font-medium text-foreground/60">
                        {mods}
                        {mods && it.notes ? " · " : ""}
                        {it.notes ?? ""}
                      </span>
                    )}
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-xs text-foreground/45">{held1 ? "espera" : it.status}</span>
                    {canRecall && (
                      <button
                        onClick={() => kds.mutate({ orderId: order.id, action: "recall", scope: "item", value: it.id })}
                        title="Recall (regresar a preparación)"
                        aria-label="Recall ítem"
                        className="grid size-5 place-items-center rounded-full text-foreground/35 transition hover:text-foreground"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="mt-1 flex gap-2">
        <button
          onClick={() => {
            kds.mutate({ orderId: order.id, action: "ready", scope: "order" });
            setOrder.mutate({ orderId: order.id, status: "ready" });
          }}
          className="flex-1 rounded-full bg-foreground px-3 py-2 text-sm font-bold text-background transition"
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
          aria-label="Recall ticket"
          title="Recall (deshacer todo el ticket)"
          className="grid place-items-center rounded-full border border-foreground/20 px-3 text-foreground/60 transition hover:bg-foreground/5"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
    </Card>
  );
}
