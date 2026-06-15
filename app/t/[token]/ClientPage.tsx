"use client";
// Experiencia del comensal por QR (web pública, sin login). Opera con el token
// efímero de mesa contra /diner/*. Construida con HeroUI v3 (dark/glass).
import { Button, Card, Spinner } from "@heroui/react";
import { ArrowLeft, Check, CheckCircle2, CreditCard, Hand, Heart, type LucideIcon, Minus, Play, Plus, Printer, Star, Trash2, Unplug, UtensilsCrossed, Wine } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LangSwitcher } from "@/components/LangSwitcher";
import { api } from "@/lib/api";
import { BrandStyle } from "@/lib/brand";
import { useLocale, useT } from "@/lib/i18n";
import { presetFor } from "@/lib/modePresets";
import { ensureNotifyPermission, useNotifier } from "@/lib/notify";
import { TERMS } from "@/lib/termsOfService";
import { tableColor } from "@/lib/tableColor";
import { useToast } from "@/lib/toast";
import type { DinerSession, MenuCategory, MenuItem, ModifierGroup, Order } from "@/lib/types";

// Línea del carrito: un ítem con un set concreto de opciones (mismo ítem con
// opciones distintas = líneas distintas).
type CartLine = { key: string; item: MenuItem; qty: number; optionIds: number[] };

function cartKey(itemId: number, optionIds: number[]): string {
  return `${itemId}::${[...optionIds].sort((a, b) => a - b).join(",")}`;
}

// Precio unitario (base + deltas elegidos). SOLO para mostrar; el backend recalcula
// y es la fuente de verdad. Refleja la misma lógica del servicio:
//  - multi: opción no-default elegida → +delta; default desmarcado → −delta.
//  - single: opción elegida → +delta.
function lineUnitPrice(item: MenuItem, optionIds: number[]): number {
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

// Resumen legible de los modificadores de una línea ("sin cebolla · +queso").
function cartLineModLabel(item: MenuItem, optionIds: number[]): string {
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

// ¿La hora local actual está dentro de la ventana [start, end]? end < start
// significa que cruza la medianoche (p.ej. 08:00→03:00). Sin ventana → true.
function withinWindow(start?: string | null, end?: string | null): boolean {
  if (!start || !end) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  if (Number.isNaN(s) || Number.isNaN(e) || s === e) return true;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

export default function DinerTablePage() {
  const { token: qrToken } = useParams<{ token: string }>();
  const { show } = useToast();
  const t = useT();
  const { locale } = useLocale();

  const [session, setSession] = useState<DinerSession | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [cat, setCat] = useState<number | "all">("all");
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [beacon, setBeacon] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [orderReady, setOrderReady] = useState(false);
  const notifier = useNotifier();
  const readyNotified = useRef(false);

  const dt = session?.token ?? null;
  const color = tableColor(session?.table_id);

  useEffect(() => {
    if (!qrToken) return;
    (async () => {
      try {
        const s = await api.post<DinerSession>("/diner/session", { qr_token: qrToken });
        setSession(s);
        const menu = await api.get<{ categories: MenuCategory[]; items: MenuItem[] }>("/diner/menu", s.token);
        setItems(menu.items ?? []);
        setCategories(menu.categories ?? []);
        const cur = await api.get<{ order: Order | null }>("/diner/order", s.token);
        setOrder(cur.order);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo abrir la mesa");
      } finally {
        setLoading(false);
      }
    })();
  }, [qrToken]);

  const refreshOrder = useCallback(async () => {
    if (!dt) return;
    const cur = await api.get<{ order: Order | null }>("/diner/order", dt);
    setOrder(cur.order);
  }, [dt]);

  // Pide permiso de notificaciones + sondea el pedido cada 12s (por si no hay realtime).
  useEffect(() => {
    ensureNotifyPermission();
  }, []);
  useEffect(() => {
    if (!dt) return;
    const id = setInterval(() => void refreshOrder(), 12000);
    return () => clearInterval(id);
  }, [dt, refreshOrder]);
  // Cuando la cocina marca el pedido LISTO → banner + notificación (una sola vez).
  useEffect(() => {
    const s = order?.status;
    if (s === "ready") {
      setOrderReady(true);
      if (!readyNotified.current) {
        readyNotified.current = true;
        notifier(t("diner.orderReady"));
      }
    } else if (s === "served" || s === "paid") {
      setOrderReady(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  // Alcohol sólo dentro del horario de venta del negocio (RACJ). Si no hay
  // ventana configurada, se permite (no rompe negocios sin alcohol).
  const alcoholOk = withinWindow(session?.alcohol_start, session?.alcohol_end);

  // Cuántas unidades de un ítem hay en el carrito (sumando sus líneas).
  const cartCount = (itemId: number) =>
    cart.filter((l) => l.item.id === itemId).reduce((s, l) => s + l.qty, 0);

  // Agrega una línea (mismo ítem + mismas opciones se fusiona; si no, línea nueva).
  const addLine = (item: MenuItem, qty: number, optionIds: number[]) => {
    if (item.is_alcohol && !alcoholOk) {
      show(t("diner.alcoholClosed"), "error");
      return;
    }
    const key = cartKey(item.id, optionIds);
    setCart((c) => {
      const i = c.findIndex((l) => l.key === key);
      if (i >= 0) {
        const next = [...c];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...c, { key, item, qty, optionIds }];
    });
  };

  const setLineQty = (key: string, qty: number) =>
    setCart((c) => (qty <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, qty } : l))));

  // Tap rápido en el "+": si el ítem tiene modificadores, abre la ficha para
  // elegirlos; si no, agrega 1 directo.
  const quickAdd = (item: MenuItem) => {
    if (item.modifier_groups?.length) {
      setDetail(item);
      return;
    }
    addLine(item, 1, []);
  };

  const cartTotal = cart.reduce((s, l) => s + lineUnitPrice(l.item, l.optionIds) * l.qty, 0);

  async function sendOrder() {
    if (!dt || !cart.length) return;
    setSending(true);
    try {
      await api.post(
        "/diner/order",
        cart.map((l) => ({ menu_item_id: l.item.id, qty: l.qty, modifiers: l.optionIds })),
        dt,
      );
      setCart([]);
      await refreshOrder();
      show(t("toast.orderSent"), "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar el pedido", "error");
    } finally {
      setSending(false);
    }
  }

  async function serviceRequest(type: "call_waiter" | "request_item", text?: string) {
    if (!dt) return;
    try {
      await api.post(
        "/diner/service-request",
        { table_id: session!.table_id, type, payload: text ? { text } : null },
        dt,
      );
      show(type === "call_waiter" ? t("toast.waiterNotified") : text ?? "", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar", "error");
    }
  }

  async function submitPrivacy(kind: "access" | "delete", contact: string) {
    if (!dt || !contact.trim()) return;
    try {
      await api.post("/diner/privacy-request", { kind, contact: contact.trim() }, dt);
      show(kind === "delete" ? "Solicitud de borrado enviada" : "Solicitud de acceso enviada", "success");
      setPrivacyOpen(false);
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar", "error");
    }
  }

  async function requestBill() {
    if (!dt) return;
    try {
      await api.post("/diner/bill", undefined, dt);
      setBillRequested(true);
      show(t("toast.billRequested"), "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo pedir la cuenta", "error");
    }
  }

  async function submitReview() {
    if (!dt || !reviewRating) return;
    try {
      await api.post("/diner/review", { rating: reviewRating, comment: reviewComment.trim() || null }, dt);
      setReviewSent(true);
      show("¡Gracias por tu opinión!", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo enviar", "error");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner color="accent" size="lg" />
      </main>
    );
  }
  if (error || !session) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <Unplug className="size-12 text-foreground/70" />
        <h1 className="text-xl font-semibold text-foreground">{t("diner.cantOpen")}</h1>
        <p className="text-foreground/60">{error ?? t("diner.cantOpenSub")}</p>
      </main>
    );
  }

  const mp = presetFor(session.mode);
  // Chips de categoría: solo las que tienen ítems. Filtro del menú por la activa.
  const usedCatIds = new Set(items.map((it) => it.category_id).filter(Boolean));
  const chipCats = categories.filter((c) => usedCatIds.has(c.id));
  const visibleItems = cat === "all" ? items : items.filter((it) => it.category_id === cat);
  const featured = items.filter((it) => it.featured);
  const pairings = detail ? items.filter((it) => it.id !== detail.id).slice(0, 8) : [];
  // Secciones del menú: agrupado por categoría cuando se ve "Todo".
  const menuGroups =
    cat === "all"
      ? [
          ...chipCats.map((c) => ({ key: String(c.id), name: c.name, list: items.filter((it) => it.category_id === c.id) })),
          { key: "none", name: chipCats.length ? "Más" : "", list: items.filter((it) => !it.category_id) },
        ].filter((g) => g.list.length)
      : [{ key: "sel", name: "", list: visibleItems }];

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-28 pt-8">
      {/* Marca del negocio (colores + tipografía) aplicada en runtime */}
      <BrandStyle business={session} />
      {/* Cabecera */}
      <header className="mb-4">
        {session.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.logo_url} alt="" className="mb-2 h-12 w-auto max-w-[170px] rounded-xl object-contain" />
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-foreground/60">
            <mp.Icon className="size-4" /> {t(`preset.${session.mode}.label`)}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={`/t/${qrToken}/carta`}
              className="flex items-center gap-1 rounded-full border border-foreground/15 px-2.5 py-1 text-xs text-foreground/60 transition hover:text-foreground"
            >
              <Printer className="size-3.5" aria-hidden /> {t("diner.printMenu")}
            </a>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="rounded-full border border-foreground/15 px-2.5 py-1 text-xs text-foreground/60 transition hover:text-foreground"
            >
              Mes données
            </button>
            <LangSwitcher />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{session.table_label}</h1>
          <span className="flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-xs text-foreground/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
            {color.name}
          </span>
        </div>
        {session.sells_alcohol && session.liquor_permit ? (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-foreground/40">
            <Wine className="size-3" /> Permis d&apos;alcool: {session.liquor_permit}
          </p>
        ) : null}
      </header>

      {/* Beacon: levanta el teléfono y el mesero te ubica por tu color */}
      <button
        onClick={() => {
          setBeacon(true);
          void serviceRequest("call_waiter");
        }}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-3xl py-4 text-lg font-extrabold shadow-lg transition active:scale-[0.98]"
        style={{ backgroundColor: color.hex, color: color.fg }}
      >
        <Hand className="size-6" /> {t("diner.here")}
      </button>

      {/* Acciones rápidas — distintas según el modo (bar / restaurante) */}
      <div className="mb-5 flex flex-wrap gap-2">
        {presetFor(session.mode).quickActions.map((qa) => (
          <QuickAction
            key={qa.id}
            icon={qa.icon}
            label={t(`qa.${qa.id}`)}
            onPress={() => {
              if (qa.kind === "call_waiter") serviceRequest("call_waiter");
              else if (qa.kind === "request_item") serviceRequest("request_item", qa.text);
              else requestBill();
            }}
          />
        ))}
      </div>

      {/* Pedido listo (la cocina avisó al mesero y a ti) */}
      {orderReady && (
        <Card className="beacon-pulse mb-5 flex items-center gap-3 rounded-3xl border border-foreground/30 bg-foreground/10 p-4 text-foreground">
          <CheckCircle2 className="size-7 shrink-0" />
          <span className="text-lg font-bold">{t("diner.orderReady")}</span>
        </Card>
      )}

      {/* Cuenta actual */}
      {order && order.items?.length ? (
        <Card className="glass mb-5 rounded-3xl p-4">
          <p className="mb-2 font-semibold text-foreground">{t("diner.yourBill")}</p>
          {order.items.map((it) => (
            <div key={it.id} className="mb-1 flex justify-between text-sm">
              <span className="text-foreground/70">
                {it.qty}× {it.name_snapshot} <span className="text-foreground/40">({it.status})</span>
              </span>
              <span className="text-foreground">${(it.price_snapshot * it.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-foreground/10 pt-2 font-bold text-foreground">
            <span>{t("common.total")}</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </Card>
      ) : null}

      {/* Ir a pagar: el comensal pide la cuenta → el mesero la cobra y emite factura */}
      {order && order.items?.length ? (
        billRequested ? (
          <Card className="glass mb-5 flex items-center gap-2 rounded-3xl p-4 text-foreground">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="text-sm">{t("diner.billRequested")}</span>
          </Card>
        ) : (
          <Button variant="primary" size="lg" fullWidth className="mb-5" onPress={() => void requestBill()}>
            <span className="flex items-center justify-center gap-2">
              <CreditCard className="size-5" /> {t("diner.payNow")} · ${Number(order.total).toFixed(2)}
            </span>
          </Button>
        )
      ) : null}

      {/* Platillo del día (destacados) */}
      {featured.length > 0 && (
        <section className="mb-5">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Star className="size-4 fill-foreground" /> {t("diner.ofTheDay")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((it) => (
              <ItemCard
                key={`feat-${it.id}`}
                it={it}
                qty={cartCount(it.id)}
                onOpen={() => setDetail(it)}
                onAdd={() => quickAdd(it)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Menú */}
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">{t(`preset.${session.mode}.menu`)}</p>

      {/* Chips de categoría (si el dueño definió categorías) */}
      {chipCats.length > 0 && (
        <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1">
          <CatChip active={cat === "all"} onClick={() => setCat("all")}>
            {t("diner.all")}
          </CatChip>
          {chipCats.map((c) => (
            <CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name}
            </CatChip>
          ))}
        </div>
      )}

      {!items.length ? (
        <p className="text-foreground/40">{t("diner.noItems")}</p>
      ) : !visibleItems.length ? (
        <p className="text-foreground/40">{t("diner.noCatItems")}</p>
      ) : (
        menuGroups.map((g) => (
          <section key={g.key} className="mb-5">
            {g.name ? <p className="mb-2 text-sm font-bold text-foreground">{g.name}</p> : null}
            <div className="grid grid-cols-2 gap-3">
              {g.list.map((it) => (
                <ItemCard
                  key={it.id}
                  it={it}
                  qty={cartCount(it.id)}
                  onOpen={() => setDetail(it)}
                  onAdd={() => quickAdd(it)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Barra de envío flotante */}
      {cart.length > 0 && (
        <div className="safe-pb fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-xl bg-gradient-to-t from-background via-background/97 to-transparent px-5 pb-1 pt-3">
          {/* Resumen del carrito (cada línea con sus modificadores) */}
          <div className="glass mb-2 flex max-h-52 flex-col gap-1.5 overflow-y-auto rounded-3xl p-2">
            {cart.map((l) => {
              const mods = cartLineModLabel(l.item, l.optionIds);
              return (
                <div key={l.key} className="flex items-center gap-2 rounded-2xl px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{l.item.name}</p>
                    {mods && <p className="truncate text-xs text-foreground/55">{mods}</p>}
                  </div>
                  <span className="shrink-0 text-sm text-foreground/70">
                    ${(lineUnitPrice(l.item, l.optionIds) * l.qty).toFixed(2)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-foreground/15 px-1.5 py-1">
                    <button
                      onClick={() => setLineQty(l.key, l.qty - 1)}
                      aria-label="Menos"
                      className="grid size-6 place-items-center rounded-full text-foreground"
                    >
                      {l.qty <= 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
                    </button>
                    <span className="w-4 text-center text-sm font-semibold text-foreground">{l.qty}</span>
                    <button
                      onClick={() => setLineQty(l.key, l.qty + 1)}
                      aria-label="Más"
                      className="grid size-6 place-items-center rounded-full text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Disclosure de contrato a distancia (Loi sur la protection du consommateur, P-40.1) */}
          <p className="mb-1.5 px-1 text-center text-[10px] leading-tight text-foreground/45">
            {TERMS.disclosure[locale]}{" "}
            <a href="/terms" target="_blank" rel="noopener" className="underline">
              {TERMS.link[locale]}
            </a>
          </p>
          <Button variant="primary" size="lg" fullWidth isDisabled={sending} onPress={sendOrder}>
            {sending ? <Spinner color="current" size="sm" /> : `${t("diner.sendOrder")} · $${cartTotal.toFixed(2)}`}
          </Button>
        </div>
      )}

      {/* Ficha del plato (detalle estilo iPhone) */}
      {detail && (
        <DishDetail
          item={detail}
          colorHex={color.hex}
          pairings={pairings}
          onClose={() => setDetail(null)}
          onOpen={(it) => setDetail(it)}
          onAdd={(n, optionIds) => addLine(detail, n, optionIds)}
        />
      )}

      {/* Privacidad (Loi 25): el comensal pide acceso o borrado de sus datos */}
      {privacyOpen && <DinerPrivacyModal onClose={() => setPrivacyOpen(false)} onSubmit={submitPrivacy} />}

      {/* Beacon full-screen: el comensal lo levanta y el mesero lo ubica por color */}
      {beacon && (
        <div
          className="beacon-pulse fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 p-8 text-center"
          style={{ backgroundColor: color.hex, color: color.fg }}
          onClick={() => setBeacon(false)}
          role="button"
          aria-label="Cerrar"
        >
          <Hand className="size-24" />
          <p className="text-2xl font-semibold opacity-90">{t("diner.liftPhone")}</p>
          <h2 className="text-6xl font-black leading-none">{session.table_label}</h2>
          <p className="text-lg font-medium opacity-90">{t("diner.waiterLocates")}</p>
          <span
            className="mt-2 rounded-full px-4 py-1.5 text-sm font-bold"
            style={{ backgroundColor: color.fg, color: color.hex }}
          >
            {color.name}
          </span>
          <span className="absolute bottom-8 text-sm opacity-70">{t("diner.tapToClose")}</span>
        </div>
      )}

      {/* Reseña del comensal */}
      {reviewSent ? (
        <Card className="glass mt-6 flex flex-col items-center gap-1 rounded-3xl p-6 text-center">
          <Star className="size-8 fill-foreground text-foreground" />
          <p className="font-semibold text-foreground">{t("diner.thanksReview")}</p>
        </Card>
      ) : (
        <Card className="glass mt-6 flex flex-col gap-3 rounded-3xl p-4">
          <p className="font-semibold text-foreground">{t("diner.howWasIt")}</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} estrella${n > 1 ? "s" : ""}`}>
                <Star className={`size-8 transition ${n <= reviewRating ? "fill-foreground text-foreground" : "text-foreground/25"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={t("diner.reviewPlaceholder")}
            rows={2}
            className="resize-none rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none"
          />
          <Button variant="primary" isDisabled={!reviewRating} onPress={submitReview}>
            {t("diner.sendReview")}
          </Button>
        </Card>
      )}
    </main>
  );
}

function QuickAction({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Button variant="secondary" size="sm" className="rounded-full" onPress={onPress}>
      <span className="flex items-center gap-1.5">
        <Icon className="size-4" /> {label}
      </span>
    </Button>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-foreground/15 bg-foreground/[0.04] text-foreground/70"
      }`}
    >
      {children}
    </button>
  );
}

// Tarjeta visual del menú (imagen arriba) — look de "menú digital".
function ItemCard({
  it,
  qty,
  onOpen,
  onAdd,
}: {
  it: MenuItem;
  qty: number;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <button onClick={onOpen} className="glass flex flex-col overflow-hidden rounded-3xl text-left">
      <div className="relative aspect-[4/3] w-full bg-foreground/[0.06]">
        {it.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.image_url} alt={it.name} className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center">
            <UtensilsCrossed className="size-7 text-foreground/25" />
          </span>
        )}
        {it.video_url ? (
          <span className="absolute left-2 top-2 grid size-6 place-items-center rounded-full bg-black/55 text-white">
            <Play className="size-3.5" />
          </span>
        ) : null}
        {it.is_alcohol ? (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Wine className="size-3" /> 18+
          </span>
        ) : null}
        {qty > 0 ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-bold text-foreground">
            {qty}
          </span>
        ) : null}
        <span
          role="button"
          aria-label={`Agregar ${it.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-full bg-foreground text-background shadow-lg transition active:scale-95"
        >
          <Plus className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <span className="line-clamp-2 font-semibold leading-tight text-foreground">{it.name}</span>
        {it.description ? <span className="mt-0.5 line-clamp-1 text-xs text-foreground/45">{it.description}</span> : null}
        {it.allergens && it.allergens.length > 0 ? (
          <span className="mt-1 flex flex-wrap gap-1">
            {it.allergens.map((a) => (
              <span key={a} className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">{a}</span>
            ))}
          </span>
        ) : null}
        <span className="mt-1 font-bold text-foreground">${Number(it.price).toFixed(2)}</span>
      </div>
    </button>
  );
}

// Loi 25: el comensal solicita acceso o borrado de sus datos. La solicitud queda
// registrada y el negocio (responsable) la atiende.
function DinerPrivacyModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (kind: "access" | "delete", contact: string) => void }) {
  const [contact, setContact] = useState("");
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground">Mes données · Loi 25</h3>
        <p className="mt-1 text-sm text-foreground/55">
          Pide una copia de tus datos o su eliminación. El establecimiento (responsable) te contactará.
        </p>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Tu email o teléfono"
          className="mt-3 w-full rounded-xl border border-foreground/15 bg-foreground/5 px-3 py-2 text-foreground outline-none"
        />
        <div className="mt-4 flex gap-2">
          <button disabled={!contact.trim()} onClick={() => onSubmit("access", contact)} className="flex-1 rounded-full bg-foreground px-3 py-2.5 text-sm font-bold text-background disabled:opacity-40">
            Pedir mis datos
          </button>
          <button disabled={!contact.trim()} onClick={() => onSubmit("delete", contact)} className="flex-1 rounded-full border border-red-500/40 px-3 py-2.5 text-sm font-semibold text-red-500 disabled:opacity-40">
            Borrar mis datos
          </button>
        </div>
        <button onClick={onClose} className="mt-3 w-full text-center text-xs text-foreground/45">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Ficha del plato: hero, descripción con "ver más", sugerencias y agregar al pedido.
function DishDetail({
  item,
  colorHex,
  pairings,
  onClose,
  onOpen,
  onAdd,
}: {
  item: MenuItem;
  colorHex: string;
  pairings: MenuItem[];
  onClose: () => void;
  onOpen: (it: MenuItem) => void;
  onAdd: (n: number, optionIds: number[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fav, setFav] = useState(false);
  const [count, setCount] = useState(1);
  const t = useT();
  const desc = item.description ?? "";
  const longDesc = desc.length > 120;

  // ── Modificadores: estado de selección (arranca con los defaults) ──
  const groups = useMemo<ModifierGroup[]>(() => item.modifier_groups ?? [], [item]);
  const [selected, setSelected] = useState<Set<number>>(() => {
    const s = new Set<number>();
    for (const g of item.modifier_groups ?? []) {
      if (g.selection === "single") {
        const def = g.options.find((o) => o.is_default && o.available);
        if (def) s.add(def.id);
      } else {
        for (const o of g.options) if (o.is_default && o.available) s.add(o.id);
      }
    }
    return s;
  });

  const toggle = (g: ModifierGroup, oid: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (g.selection === "single") {
        const was = next.has(oid);
        for (const o of g.options) next.delete(o.id);
        if (!was) next.add(oid);
        else if (g.min_select >= 1) next.add(oid); // obligatorio: no dejar vacío
      } else {
        if (next.has(oid)) next.delete(oid);
        else {
          const n = g.options.filter((o) => next.has(o.id)).length;
          if (g.max_select != null && n >= g.max_select) return prev; // tope
          next.add(oid);
        }
      }
      return next;
    });
  };

  const groupOk = (g: ModifierGroup) => {
    const n = g.options.filter((o) => selected.has(o.id)).length;
    if (g.selection === "single") return g.min_select >= 1 ? n === 1 : n <= 1;
    return n >= g.min_select && (g.max_select == null || n <= g.max_select);
  };
  const valid = groups.every(groupOk);
  const optionIds = [...selected];
  const unitPrice = lineUnitPrice(item, optionIds);

  return (
    <div className="fixed inset-0 z-[55] overflow-y-auto bg-background pb-28">
      {/* Hero: video (autoplay en bucle) si existe, si no la foto */}
      <div className="relative">
        {item.video_url ? (
          <video
            src={item.video_url}
            poster={item.image_url ?? undefined}
            className="h-72 w-full bg-foreground/10 object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="h-72 w-full object-cover" />
        ) : (
          <div className="h-72 w-full" style={{ backgroundColor: colorHex }} />
        )}
        <div className="safe-pt absolute inset-x-0 top-0 flex items-center justify-between px-4">
          <button
            onClick={onClose}
            aria-label="Volver"
            className="grid size-10 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            onClick={() => setFav((v) => !v)}
            aria-label="Favorito"
            className="grid size-10 place-items-center rounded-full bg-background/80 backdrop-blur"
          >
            <Heart className={`size-5 ${fav ? "fill-foreground text-foreground" : "text-foreground"}`} />
          </button>
        </div>
      </div>

      {/* Tarjeta */}
      <div className="relative -mt-6 rounded-t-3xl bg-surface px-5 pt-6">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">{item.name}</h1>
          <span className="shrink-0 text-2xl font-bold text-foreground">${Number(item.price).toFixed(2)}</span>
        </div>
        {desc ? (
          <p className="leading-relaxed text-foreground/60">
            {expanded || !longDesc ? desc : `${desc.slice(0, 120)}… `}
            {longDesc && (
              <button onClick={() => setExpanded((v) => !v)} className="font-semibold text-foreground">
                {expanded ? ` ${t("diner.seeLess")}` : t("diner.seeMore")}
              </button>
            )}
          </p>
        ) : (
          <p className="text-foreground/40">{t("diner.noDescription")}</p>
        )}

        {pairings.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">{t("diner.alsoLike")}</p>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
              {pairings.map((p) => (
                <button key={p.id} onClick={() => onOpen(p)} className="w-32 shrink-0 text-left">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="mb-1 h-24 w-32 rounded-2xl object-cover" />
                  ) : (
                    <div className="mb-1 h-24 w-32 rounded-2xl bg-foreground/[0.06]" />
                  )}
                  <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                  <span className="block text-xs text-foreground/60">${Number(p.price).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modificadores / ingredientes (el backend valida y precia) */}
        {groups.length > 0 && (
          <div className="mt-6 flex flex-col gap-5">
            {groups.map((g) => {
              const n = g.options.filter((o) => selected.has(o.id)).length;
              const req = g.min_select >= 1;
              return (
                <div key={g.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{g.name}</p>
                    <span className={`text-[11px] ${req && n < g.min_select ? "font-semibold text-red-500" : "text-foreground/45"}`}>
                      {req ? t("diner.required") : t("diner.optional")}
                      {g.selection === "multi" && g.max_select ? ` · ${t("diner.upTo")} ${g.max_select}` : ""}
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
        )}
      </div>

      {/* Barra inferior: cantidad + agregar */}
      <div className="safe-pb fixed inset-x-0 bottom-0 z-[56] mx-auto flex w-full max-w-xl items-center gap-3 bg-surface/95 px-5 pt-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-full border border-foreground/15 px-2 py-1.5">
          <button onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="Menos" className="grid size-7 place-items-center rounded-full text-foreground">
            <Minus className="size-4" />
          </button>
          <span className="w-5 text-center font-semibold text-foreground">{count}</span>
          <button onClick={() => setCount((c) => c + 1)} aria-label="Más" className="grid size-7 place-items-center rounded-full text-foreground">
            <Plus className="size-4" />
          </button>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          isDisabled={!valid}
          onPress={() => {
            onAdd(count, optionIds);
            onClose();
          }}
        >
          {t("common.add")} · ${(unitPrice * count).toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
