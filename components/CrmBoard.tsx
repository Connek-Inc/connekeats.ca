"use client";
// Módulo Clientes (CRM) — Fase 1+2: lista buscable, alta manual, ficha 360
// (stats + favoritos + historial de pedidos delivery) y export CSV. Los clientes
// también se crean solos con cada pedido de Delivery (auto-captura por teléfono).

import { Button, Card, Input, Spinner } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Search, Star, Users, X } from "lucide-react";
import { useCallback, useState } from "react";

import {
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDeleteCustomer,
  useReviews,
  useUpdateCustomer,
} from "@/lib/hooks";
import { useRealtime } from "@/lib/realtime";
import { useToast } from "@/lib/toast";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

export function CrmBoard({ businessId }: { businessId: number }) {
  const { show } = useToast();
  const qc = useQueryClient();
  const refreshC = useCallback(() => qc.invalidateQueries({ queryKey: ["customers", businessId] }), [qc, businessId]);
  const refreshR = useCallback(() => qc.invalidateQueries({ queryKey: ["reviews", businessId] }), [qc, businessId]);
  useRealtime("customer", businessId, refreshC);
  useRealtime("review", businessId, refreshR);
  const [q, setQ] = useState("");
  const customers = useCustomers(businessId, q || undefined);
  const reviews = useReviews(businessId);
  const create = useCreateCustomer(businessId);
  const [adding, setAdding] = useState(false);
  const [nName, setNName] = useState("");
  const [nPhone, setNPhone] = useState("");
  const [nEmail, setNEmail] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [seg, setSeg] = useState<"all" | "vip" | "freq" | "inactive" | "bday">("all");

  const list = customers.data ?? [];
  const month = new Date().getMonth();
  const daysSince = (s?: string | null) => (s ? (Date.now() - new Date(s).getTime()) / 86400000 : Infinity);
  const filtered = list.filter((c) => {
    if (seg === "vip") return (c.tags ?? []).includes("VIP");
    if (seg === "freq") return (c.orders ?? 0) >= 3;
    if (seg === "inactive") return !!c.last_order && daysSince(c.last_order) > 30;
    if (seg === "bday") return !!c.birthday && Number(c.birthday.slice(5, 7)) - 1 === month;
    return true;
  });
  const SEGS: { k: typeof seg; label: string }[] = [
    { k: "all", label: "Todos" },
    { k: "vip", label: "VIP" },
    { k: "freq", label: "Frecuentes" },
    { k: "inactive", label: "Inactivos" },
    { k: "bday", label: "Cumpleañeros" },
  ];
  const SEG_FILE: Record<typeof seg, string> = {
    all: "todos",
    vip: "vip",
    freq: "frecuentes",
    inactive: "inactivos",
    bday: "cumpleaneros",
  };

  // Dashboard (sobre toda la base cargada)
  const now = new Date();
  const yr = now.getFullYear();
  const nuevos = list.filter(
    (c) => c.created_at && new Date(c.created_at).getMonth() === month && new Date(c.created_at).getFullYear() === yr,
  ).length;
  const recurrentes = list.filter((c) => (c.orders ?? 0) >= 2).length;
  const cumpleMes = list.filter((c) => !!c.birthday && Number(c.birthday.slice(5, 7)) - 1 === month).length;
  const top = [...list]
    .filter((c) => (c.total_spent ?? 0) > 0)
    .sort((a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0))
    .slice(0, 3);

  // Exporta el SEGMENTO actual (campaña): respeta búsqueda + chip activo.
  function exportCsv() {
    if (!filtered.length) return show("No hay clientes para exportar", "error");
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["name", "phone", "email", "birthday", "address", "tags", "orders", "total_spent", "last_order", "notes"];
    const lines = [header.join(",")];
    for (const c of filtered) {
      lines.push(
        [c.name, c.phone, c.email, c.birthday, c.address, (c.tags ?? []).join("; "), c.orders ?? 0, c.total_spent ?? 0, c.last_order, c.notes]
          .map(esc)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${SEG_FILE[seg]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    show(`Exportados ${filtered.length} clientes`, "success");
  }

  const addCustomer = async () => {
    if (!nName.trim()) return show("Nombre requerido", "error");
    try {
      await create.mutateAsync({ name: nName.trim(), phone: nPhone.trim() || null, email: nEmail.trim() || null });
      setNName("");
      setNPhone("");
      setNEmail("");
      setAdding(false);
      show("Cliente agregado", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "No se pudo agregar", "error");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Dashboard del CRM */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Clientes" value={String(list.length)} />
        <Stat label="Nuevos (mes)" value={String(nuevos)} />
        <Stat label="Recurrentes" value={String(recurrentes)} />
        <Stat label="Cumpleaños" value={String(cumpleMes)} />
      </div>
      {top.length > 0 && (
        <Card className="glass flex flex-col gap-1 rounded-2xl p-3">
          <p className="text-[11px] uppercase tracking-wide text-foreground/45">Top clientes</p>
          {top.map((c, i) => (
            <button key={c.id} onClick={() => setSel(c.id)} className="flex items-center justify-between gap-2 text-left text-sm">
              <span className="min-w-0 truncate text-foreground/80">
                {i + 1}. {c.name}
              </span>
              <span className="shrink-0 font-medium text-foreground">{money(c.total_spent ?? 0)}</span>
            </button>
          ))}
        </Card>
      )}
      {reviews.data && reviews.data.count > 0 && (
        <Card className="glass flex flex-col gap-1.5 rounded-2xl p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-foreground/45">Reseñas</p>
            <span className="flex items-center gap-1 text-sm font-bold text-foreground">
              <Star className="size-4 fill-foreground text-foreground" /> {reviews.data.avg} · {reviews.data.count}
            </span>
          </div>
          {reviews.data.reviews
            .filter((r) => r.comment)
            .slice(0, 3)
            .map((r) => (
              <div key={r.id} className="flex items-start gap-2 border-t border-foreground/5 pt-1.5 text-sm">
                <span className="flex shrink-0 gap-0.5 pt-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-3 fill-foreground text-foreground" />
                  ))}
                </span>
                <span className="min-w-0 text-foreground/80">{r.comment}</span>
              </div>
            ))}
        </Card>
      )}

      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre, teléfono o email"
            className="w-full rounded-xl border border-foreground/15 bg-foreground/5 py-2 pl-9 pr-3 text-sm text-foreground outline-none"
          />
        </div>
        <Button isIconOnly variant="secondary" className="rounded-xl" aria-label="Exportar CSV" onPress={exportCsv}>
          <Download className="size-4" />
        </Button>
        <Button isIconOnly variant="primary" className="rounded-xl" aria-label="Nuevo cliente" onPress={() => setAdding((v) => !v)}>
          <Plus className="size-4" />
        </Button>
      </div>

      {adding && (
        <Card className="glass flex flex-col gap-2 rounded-2xl p-3">
          <Input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Nombre *" fullWidth />
          <div className="flex gap-2">
            <Input value={nPhone} onChange={(e) => setNPhone(e.target.value)} placeholder="Teléfono" fullWidth />
            <Input value={nEmail} onChange={(e) => setNEmail(e.target.value)} placeholder="Email" fullWidth />
          </div>
          <Button variant="primary" isDisabled={create.isPending} onPress={addCustomer}>
            Agregar cliente
          </Button>
        </Card>
      )}

      {/* Segmentos */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {SEGS.map((s) => (
          <button
            key={s.k}
            onClick={() => setSeg(s.k)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              seg === s.k
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/15 bg-foreground/[0.04] text-foreground/70"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-foreground/50">Clientes · {filtered.length}</p>
        {customers.isLoading ? (
          <Spinner color="accent" size="sm" />
        ) : filtered.length ? (
          filtered.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)} className="glass flex items-center justify-between gap-2 rounded-2xl p-3 text-left">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="truncate text-xs text-foreground/50">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "Sin contacto"}
                  {c.orders ? ` · ${c.orders} pedido${c.orders > 1 ? "s" : ""}` : ""}
                </p>
                {(c.tags ?? []).length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {(c.tags ?? []).map((t) => (
                      <span key={t} className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground/70">
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/10 text-sm font-bold text-foreground">
                {c.name.slice(0, 1).toUpperCase()}
              </span>
            </button>
          ))
        ) : (
          <Card className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center text-foreground/50">
            <Users className="size-8 text-foreground/40" />
            {seg === "all"
              ? "Aún no hay clientes. Se crean solos con cada pedido de Delivery, o agrégalos con +."
              : "Ningún cliente en este segmento."}
          </Card>
        )}
      </section>

      {sel && <CustomerSheet businessId={businessId} customerId={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-2 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-foreground/45">{label}</p>
    </div>
  );
}

function Field({ label, defaultValue, onSave }: { label: string; defaultValue: string; onSave: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-foreground/45">{label}</span>
      <input
        defaultValue={defaultValue}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== defaultValue) onSave(v);
        }}
        className="rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm text-foreground outline-none"
      />
    </label>
  );
}

function TagsEditor({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  const [tags, setTags] = useState<string[]>(value);
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (!t || tags.includes(t)) {
      setInput("");
      return;
    }
    const next = [...tags, t];
    setTags(next);
    onChange(next);
    setInput("");
  };
  const remove = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.length ? (
          tags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-foreground/10 py-1 pl-2.5 pr-1 text-xs text-foreground/80">
              {t}
              <button onClick={() => remove(t)} aria-label={`Quitar ${t}`} className="grid size-4 place-items-center rounded-full hover:bg-foreground/20">
                <X className="size-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-foreground/40">Sin etiquetas</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ej: VIP, Frecuente, Cumpleañero"
          className="flex-1 rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-1.5 text-sm text-foreground outline-none"
        />
        <Button size="sm" variant="secondary" onPress={add}>
          Añadir
        </Button>
      </div>
    </div>
  );
}

function CustomerSheet({ businessId, customerId, onClose }: { businessId: number; customerId: number; onClose: () => void }) {
  const detail = useCustomer(businessId, customerId);
  const update = useUpdateCustomer(businessId);
  const del = useDeleteCustomer(businessId);
  const { show } = useToast();
  const d = detail.data;
  const c = d?.customer;
  const onErr = { onError: () => show("No se pudo guardar", "error") };

  const fav: Record<string, number> = {};
  (d?.orders ?? []).forEach((o) =>
    (o.items ?? []).forEach((it) => {
      fav[it.name] = (fav[it.name] ?? 0) + (it.qty || 0);
    }),
  );
  const favTop = Object.entries(fav).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Portabilidad (Loi 25): descarga TODOS los datos del cliente en JSON estructurado.
  const exportJson = () => {
    if (!d) return;
    const payload = { exported_at: new Date().toISOString(), customer: c, stats: d.stats, orders: d.orders };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cliente-${customerId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">{c?.name ?? "Cliente"}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-foreground/50 hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        {!d ? (
          <Spinner color="accent" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Pedidos" value={String(d.stats.orders)} />
              <Stat label="Gastado" value={money(d.stats.total_spent)} />
              <Stat label="Ticket prom." value={money(d.stats.avg_ticket)} />
            </div>

            <div className="flex flex-col gap-2">
              <Field label="Nombre" defaultValue={c?.name ?? ""} onSave={(v) => v && update.mutate({ id: customerId, name: v }, onErr)} />
              <Field label="Teléfono" defaultValue={c?.phone ?? ""} onSave={(v) => update.mutate({ id: customerId, phone: v || null }, onErr)} />
              <Field label="Email" defaultValue={c?.email ?? ""} onSave={(v) => update.mutate({ id: customerId, email: v || null }, onErr)} />
              <Field label="Cumpleaños (YYYY-MM-DD)" defaultValue={c?.birthday ?? ""} onSave={(v) => update.mutate({ id: customerId, birthday: v || null }, onErr)} />
              <Field label="Dirección" defaultValue={c?.address ?? ""} onSave={(v) => update.mutate({ id: customerId, address: v || null }, onErr)} />
              <Field label="Notas" defaultValue={c?.notes ?? ""} onSave={(v) => update.mutate({ id: customerId, notes: v || null }, onErr)} />
            </div>

            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-foreground/50">Etiquetas / segmentos</p>
              <TagsEditor value={c?.tags ?? []} onChange={(t) => update.mutate({ id: customerId, tags: t }, onErr)} />
            </div>

            {favTop.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-foreground/50">Favoritos</p>
                <div className="flex flex-wrap gap-2">
                  {favTop.map(([n, qty]) => (
                    <span key={n} className="rounded-full border border-foreground/15 bg-foreground/[0.06] px-3 py-1 text-xs text-foreground/80">
                      {n} ×{qty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-foreground/50">Historial · {d.orders.length}</p>
              {d.orders.length ? (
                d.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 border-b border-foreground/5 py-1.5 text-sm">
                    <span className="min-w-0 truncate text-foreground/70">
                      {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ") || "Pedido"}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">{money(Number(o.total))}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-foreground/40">Sin pedidos aún.</p>
              )}
            </div>

            {/* Derechos del titular (Loi 25): portabilidad (exportar) + olvido (eliminar) */}
            <div className="flex flex-wrap items-center gap-4 border-t border-foreground/10 pt-3">
              <span className="text-[11px] uppercase tracking-wide text-foreground/40">Privacidad</span>
              <button onClick={exportJson} className="text-sm text-foreground/60 transition hover:text-foreground">
                Exportar datos (JSON)
              </button>
              <button
                onClick={() => {
                  if (window.confirm("¿Eliminar definitivamente los datos de este cliente? (derecho al olvido)"))
                    del.mutate(customerId, { onSuccess: onClose, onError: () => show("No se pudo eliminar", "error") });
                }}
                className="text-sm text-foreground/50 transition hover:text-foreground"
              >
                Eliminar (derecho al olvido)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
