"use client";
// Experiencia del comensal por QR (web pública, sin login). Opera con el token
// efímero de mesa contra /diner/*. Construida con HeroUI v3 (dark/glass).
import { Button, Card, Spinner } from "@heroui/react";
import { ArrowLeft, CheckCircle2, CreditCard, Hand, Heart, type LucideIcon, Minus, Play, Plus, Star, Unplug, UtensilsCrossed } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LangSwitcher } from "@/components/LangSwitcher";
import { api } from "@/lib/api";
import { BrandStyle } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { presetFor } from "@/lib/modePresets";
import { tableColor } from "@/lib/tableColor";
import { useToast } from "@/lib/toast";
import type { DinerSession, MenuCategory, MenuItem, Order } from "@/lib/types";

export default function DinerTablePage() {
  const { token: qrToken } = useParams<{ token: string }>();
  const { show } = useToast();
  const t = useT();

  const [session, setSession] = useState<DinerSession | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [cat, setCat] = useState<number | "all">("all");
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [beacon, setBeacon] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

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

  const add = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const addQty = (id: number, n: number) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + n }));

  const cartLines = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ item: items.find((i) => i.id === Number(id))!, qty })),
    [cart, items],
  );
  const cartTotal = cartLines.reduce((s, l) => s + (l.item?.price ?? 0) * l.qty, 0);

  async function sendOrder() {
    if (!dt || !cartLines.length) return;
    setSending(true);
    try {
      await api.post("/diner/order", cartLines.map((l) => ({ menu_item_id: l.item.id, qty: l.qty })), dt);
      setCart({});
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
            <mp.Icon className="size-4" /> {mp.label}
          </p>
          <LangSwitcher />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{session.table_label}</h1>
          <span className="flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-xs text-foreground/70">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
            {color.name}
          </span>
        </div>
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
            label={qa.label}
            onPress={() => {
              if (qa.kind === "call_waiter") serviceRequest("call_waiter");
              else if (qa.kind === "request_item") serviceRequest("request_item", qa.text);
              else requestBill();
            }}
          />
        ))}
      </div>

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
                qty={cart[it.id] ?? 0}
                onOpen={() => setDetail(it)}
                onAdd={() => add(it.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Menú */}
      <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">{mp.terms.menu}</p>

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
                  qty={cart[it.id] ?? 0}
                  onOpen={() => setDetail(it)}
                  onAdd={() => add(it.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Barra de envío flotante */}
      {cartLines.length > 0 && (
        <div className="safe-pb fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-xl px-5 pt-2">
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
          onAdd={(n) => addQty(detail.id, n)}
        />
      )}

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
        <span className="mt-1 font-bold text-foreground">${Number(it.price).toFixed(2)}</span>
      </div>
    </button>
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
  onAdd: (n: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fav, setFav] = useState(false);
  const [count, setCount] = useState(1);
  const t = useT();
  const desc = item.description ?? "";
  const longDesc = desc.length > 120;

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
        <Button variant="primary" size="lg" className="flex-1" onPress={() => { onAdd(count); onClose(); }}>
          {t("common.add")} · ${(Number(item.price) * count).toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
