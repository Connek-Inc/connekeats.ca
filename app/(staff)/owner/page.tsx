"use client";

import { Button, Card, Chip, Input, Spinner } from "@heroui/react";
import {
  Armchair,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Check,
  ChefHat,
  Cog,
  ConciergeBell,
  Construction,
  FileText,
  ImagePlus,
  type LucideIcon,
  Play,
  Plus,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FloorMap } from "@/components/FloorMap";
import { Toggle } from "@/components/Toggle";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { API_URL } from "@/lib/config";
import {
  useAddStaffById,
  useAssignZone,
  useBulkCreateTables,
  useBusinesses,
  useCancelInvite,
  useChangeStaffRole,
  useCreateCategory,
  useCreateFloor,
  useCreateMenuItem,
  useCreateTable,
  useDeleteCategory,
  useDeleteMenuItem,
  useDeleteTable,
  useEmployees,
  useFloors,
  useInviteStaff,
  useMenu,
  useRemoveStaff,
  useStaff,
  useTables,
  useUpdateBusiness,
  useUpdateMenuItem,
  useUpdateTable,
  useUploadMenuImage,
  useUploadMenuVideo,
  useUpsertEmployee,
} from "@/lib/hooks";
import { presetFor, type ModeKey } from "@/lib/modePresets";
import { MODULES } from "@/lib/modules";
import { supabase } from "@/lib/supabase";
import { tableColor } from "@/lib/tableColor";
import { useToast } from "@/lib/toast";
import type { Business, Employee, MenuCategory, MenuItem } from "@/lib/types";

export default function OwnerPage() {
  const { businessId } = useBusiness();
  const businesses = useBusinesses();
  const router = useRouter();
  const active = businesses.data?.find((b) => b.id === businessId) ?? null;
  const mode: ModeKey = active?.mode ?? "restaurant";
  const preset = presetFor(mode);
  const { roles } = useAuth();
  const myRoles = roles.filter((r) => r.business_id === businessId).map((r) => r.role);
  const isOwner = myRoles.includes("owner");
  const [tab, setTab] = useState<"negocio" | "mesas" | "menu" | "equipo">(() => (isOwner ? "negocio" : "mesas"));
  const TABS: { k: typeof tab; label: string }[] = [
    { k: "mesas", label: "Mesas & Zonas" },
    { k: "menu", label: "Menú" },
    { k: "equipo", label: "Equipo" },
  ];
  if (isOwner) TABS.unshift({ k: "negocio", label: "Negocio" });

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{active ? active.name : "Tu negocio"}</h1>
          {active && (
            <p className="text-sm text-foreground/50">
              Gestiona {preset.terms.tables}, {preset.terms.menu} y QRs
            </p>
          )}
        </div>
        {active && (
          <Chip color="accent" size="sm">
            <span className="flex items-center gap-1">
              <preset.Icon className="size-3.5" /> {preset.label}
            </span>
          </Chip>
        )}
      </header>

      {!businessId ? (
        <NoBusiness onCreate={() => router.push("/onboarding")} onHome={() => router.push("/home")} />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Sub-navegación del Setup (una sección a la vez) */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  tab === t.k
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 bg-foreground/[0.04] text-foreground/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "negocio" && isOwner && active && <Settings business={active} />}
          {tab === "mesas" && (
            <>
              <Tables businessId={businessId} mode={mode} />
              <Zones businessId={businessId} />
            </>
          )}
          {tab === "menu" && <Menu businessId={businessId} mode={mode} />}
          {tab === "equipo" && <Staff businessId={businessId} features={active?.features ?? []} />}
        </div>
      )}
    </main>
  );
}

function NoBusiness({ onCreate, onHome }: { onCreate: () => void; onHome: () => void }) {
  return (
    <Card className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
      <Construction className="size-10 text-foreground/70" />
      <h2 className="text-lg font-semibold text-foreground">No hay un negocio activo</h2>
      <p className="text-foreground/55">Crea uno con el asistente, o elige uno existente desde el inicio.</p>
      <div className="flex gap-2">
        <Button variant="primary" onPress={onCreate}>
          Crear negocio
        </Button>
        <Button variant="secondary" onPress={onHome}>
          Ir al inicio
        </Button>
      </div>
    </Card>
  );
}

function Tables({ businessId, mode }: { businessId: number; mode: ModeKey }) {
  const tables = useTables(businessId);
  const createTable = useCreateTable(businessId);
  const bulkCreate = useBulkCreateTables(businessId);
  const delTable = useDeleteTable(businessId);
  const { show } = useToast();
  const [label, setLabel] = useState("");
  const [bulkCount, setBulkCount] = useState("5");
  const preset = presetFor(mode);
  const count = tables.data?.length ?? 0;
  const updateTable = useUpdateTable(businessId);
  const floors = useFloors(businessId);
  const [mapSel, setMapSel] = useState<number | null>(null);
  const sel = tables.data?.find((t) => t.id === mapSel) ?? null;
  const moveTable = (dx: number, dy: number) => {
    if (!sel) return;
    updateTable.mutate({
      tableId: sel.id,
      data: {
        pos_x: Math.min(5, Math.max(0, (sel.pos_x ?? 0) + dx)),
        pos_y: Math.max(0, (sel.pos_y ?? 0) + dy),
      },
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground/50">{preset.terms.tables}</p>
        {count > 0 && <span className="text-xs text-foreground/40">{count}</span>}
      </div>

      <div className="flex items-stretch gap-2">
        <Input
          fullWidth
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`Ej: ${preset.tableDefaults.labelPrefix} 1`}
        />
        <Button
          variant="primary"
          isDisabled={createTable.isPending}
          onPress={async () => {
            if (!label.trim()) return;
            await createTable.mutateAsync({ label: label.trim() });
            setLabel("");
            show(`${preset.terms.table} creada`, "success");
          }}
        >
          Añadir
        </Button>
      </div>

      {/* Crear varias de golpe (usa el prefijo/capacidad del modo) */}
      <div className="flex items-stretch gap-2">
        <Input
          className="w-24"
          type="number"
          min={1}
          value={bulkCount}
          onChange={(e) => setBulkCount(e.target.value)}
          placeholder="5"
        />
        <Button
          variant="secondary"
          isDisabled={bulkCreate.isPending}
          onPress={async () => {
            const n = Number(bulkCount) || 0;
            if (n < 1) return show("Pon un número mayor a 0", "error");
            await bulkCreate.mutateAsync({
              count: n,
              label_prefix: preset.tableDefaults.labelPrefix,
              capacity: preset.tableDefaults.capacity,
            });
            show(`${n} ${preset.terms.tables} creadas`, "success");
          }}
        >
          {bulkCreate.isPending ? (
            <Spinner color="current" size="sm" />
          ) : (
            `+ Añadir varias (${preset.tableDefaults.labelPrefix})`
          )}
        </Button>
      </div>

      {/* Mapa del salón — arreglar posiciones (cuadrícula) */}
      {tables.data && tables.data.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-foreground/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-foreground/45">Toca una mesa y muévela con las flechas</p>
            <button
              type="button"
              onClick={() =>
                (tables.data ?? []).forEach((t, i) =>
                  updateTable.mutate({ tableId: t.id, data: { pos_x: i % 6, pos_y: Math.floor(i / 6) } }),
                )
              }
              className="shrink-0 text-[11px] text-foreground/60 underline hover:text-foreground"
            >
              Auto-ordenar
            </button>
          </div>
          <FloorMap
            tables={tables.data}
            selectedId={mapSel}
            onSelect={(id) => setMapSel(id)}
            statusLabel={(t) => `${t.capacity}p`}
          />
          {sel && (
            <div className="flex items-center justify-center gap-2">
              <span className="mr-1 text-xs text-foreground/60">{sel.label}</span>
              <Button isIconOnly size="sm" variant="secondary" className="rounded-full" aria-label="Mover a la izquierda" onPress={() => moveTable(-1, 0)}>
                <ArrowLeft className="size-4" />
              </Button>
              <Button isIconOnly size="sm" variant="secondary" className="rounded-full" aria-label="Mover arriba" onPress={() => moveTable(0, -1)}>
                <ArrowUp className="size-4" />
              </Button>
              <Button isIconOnly size="sm" variant="secondary" className="rounded-full" aria-label="Mover abajo" onPress={() => moveTable(0, 1)}>
                <ArrowDown className="size-4" />
              </Button>
              <Button isIconOnly size="sm" variant="secondary" className="rounded-full" aria-label="Mover a la derecha" onPress={() => moveTable(1, 0)}>
                <ArrowRight className="size-4" />
              </Button>
              <select
                value={sel.floor_id ?? ""}
                onChange={(e) =>
                  updateTable.mutate({
                    tableId: sel.id,
                    data: { floor_id: e.target.value ? Number(e.target.value) : null },
                  })
                }
                className={`${zoneSelectCls} ml-1`}
                aria-label="Zona de la mesa"
              >
                <option value="">Zona…</option>
                {floors.data?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tables.data?.map((t) => (
          <Card key={t.id} className="glass flex flex-row items-center justify-between rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tableColor(t.id).hex }} />
              <div>
                <p className="font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-foreground/40">
                  {t.status} · {t.capacity} pers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a className="text-foreground/70" href={`/t/${t.qr_token}`} target="_blank" rel="noreferrer">
                Abrir web
              </a>
              <TableQR businessId={businessId} tableId={t.id} label={t.label} />
              <button
                className="text-foreground/40 transition hover:text-foreground"
                aria-label={`Eliminar ${t.label}`}
                onClick={() => delTable.mutate(t.id, { onError: () => show("No se pudo eliminar", "error") })}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </Card>
        ))}
        {!count && <EmptyHint icon={Armchair} text={`Aún no hay ${preset.terms.tables}. Añade una o varias arriba.`} />}
      </div>
    </section>
  );
}

// Gestor de categorías: el dueño las crea/borra. Los ítems se asignan a una.
function CategoryManager({ businessId, categories }: { businessId: number; categories: MenuCategory[] }) {
  const create = useCreateCategory(businessId);
  const del = useDeleteCategory(businessId);
  const { show } = useToast();
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-foreground/10 p-3">
      <p className="text-[11px] uppercase tracking-wide text-foreground/45">Categorías</p>
      <div className="flex items-stretch gap-2">
        <Input fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría (ej: Bebidas)" />
        <Button
          variant="secondary"
          isDisabled={create.isPending}
          onPress={async () => {
            if (!name.trim()) return;
            await create.mutateAsync({ name: name.trim() });
            setName("");
            show("Categoría creada", "success");
          }}
        >
          Añadir
        </Button>
      </div>
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 rounded-full border border-foreground/15 bg-foreground/[0.06] py-1 pl-3 pr-1 text-xs text-foreground/80"
            >
              {c.name}
              <button
                aria-label={`Borrar ${c.name}`}
                onClick={() => del.mutate(c.id, { onError: () => show("No se pudo borrar", "error") })}
                className="grid size-5 place-items-center rounded-full text-foreground/40 transition hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-foreground/40">Crea categorías para organizar el menú (Comidas, Bebidas, Postres…).</p>
      )}
    </div>
  );
}

function Menu({ businessId, mode }: { businessId: number; mode: ModeKey }) {
  const menu = useMenu(businessId);
  const createItem = useCreateMenuItem(businessId);
  const { show } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [catId, setCatId] = useState("");
  const preset = presetFor(mode);
  const items = menu.data?.items ?? [];
  const categories = menu.data?.categories ?? [];

  // Agrupa por categoría (en su orden) + "Sin categoría". Solo grupos con ítems.
  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name, items: items.filter((it) => it.category_id === c.id) })),
    { id: null as number | null, name: "Sin categoría", items: items.filter((it) => !it.category_id) },
  ].filter((g) => g.items.length > 0);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-foreground/50">{preset.terms.menu}</p>
        {items.length > 0 && <span className="text-xs text-foreground/40">{items.length} ítems</span>}
      </div>

      <CategoryManager businessId={businessId} categories={categories} />

      {/* Añadir ítem (con categoría opcional) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-stretch gap-2">
          <Input fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="Ítem (ej: Hamburguesa)" />
          <Input className="w-24" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$0" />
        </div>
        <div className="flex items-stretch gap-2">
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="flex-1 rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none"
          >
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            isDisabled={createItem.isPending}
            onPress={async () => {
              if (!name.trim()) return show("Nombre del ítem requerido", "error");
              await createItem.mutateAsync({
                name: name.trim(),
                price: Number(price) || 0,
                available_in: mode,
                category_id: catId ? Number(catId) : null,
              });
              setName("");
              setPrice("");
              show("Ítem añadido", "success");
            }}
          >
            Añadir
          </Button>
        </div>
      </div>

      {/* Lista agrupada por categoría */}
      {items.length ? (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={String(g.id)} className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/40">{g.name}</p>
              {g.items.map((it) => (
                <MenuItemRow key={it.id} businessId={businessId} item={it} categories={categories} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <EmptyHint icon={FileText} text={`Tu ${preset.terms.menu} está vacío. Añade tu primer ítem arriba.`} />
      )}
    </section>
  );
}

function MenuItemRow({ businessId, item, categories }: { businessId: number; item: MenuItem; categories: MenuCategory[] }) {
  const update = useUpdateMenuItem(businessId);
  const del = useDeleteMenuItem(businessId);
  const uploadImg = useUploadMenuImage(businessId);
  const uploadVid = useUploadMenuVideo(businessId);
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const onErr = { onError: () => show("No se pudo guardar", "error") };

  const pickImage = (f: File | undefined) => {
    if (!f) return;
    uploadImg.mutate(
      { itemId: item.id, file: f },
      {
        onSuccess: () => show("Foto actualizada", "success"),
        onError: (e) => show(e instanceof Error ? e.message : "No se pudo subir la foto", "error"),
      },
    );
  };
  const pickVideo = (f: File | undefined) => {
    if (!f) return;
    uploadVid.mutate(
      { itemId: item.id, file: f },
      {
        onSuccess: () => show("Video actualizado", "success"),
        onError: (e) => show(e instanceof Error ? e.message : "No se pudo subir el video", "error"),
      },
    );
  };

  return (
    <Card className={`glass flex flex-row items-start gap-3 rounded-2xl p-3 ${item.available ? "" : "opacity-50"}`}>
      {/* Media del ítem: foto + video corto */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={`Foto de ${item.name}`}
          title="Subir o cambiar foto"
          className="relative grid size-14 place-items-center overflow-hidden rounded-xl border border-foreground/15 bg-foreground/[0.04]"
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt={item.name} className="absolute inset-0 size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-foreground/40" />
          )}
          {item.video_url && (
            <span className="absolute bottom-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-background/80">
              <Play className="size-2.5 text-foreground" />
            </span>
          )}
          {uploadImg.isPending && (
            <span className="absolute inset-0 grid place-items-center bg-background/60">
              <Spinner size="sm" color="current" />
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => vidRef.current?.click()}
          title="Subir video corto"
          className="flex items-center gap-1 text-[10px] text-foreground/50 transition hover:text-foreground"
        >
          {uploadVid.isPending ? (
            <Spinner size="sm" color="current" />
          ) : (
            <>
              <Video className="size-3" /> Video
            </>
          )}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={vidRef} type="file" accept="video/*" hidden onChange={(e) => { pickVideo(e.target.files?.[0]); e.target.value = ""; }} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* línea 1: nombre + borrar */}
        <div className="flex items-center gap-2">
          <input
            defaultValue={item.name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== item.name) update.mutate({ itemId: item.id, data: { name: v } }, onErr);
            }}
            className="min-w-0 flex-1 bg-transparent font-medium text-foreground outline-none"
          />
          <button
            className="shrink-0 text-foreground/40 transition hover:text-foreground"
            aria-label={`Eliminar ${item.name}`}
            onClick={() => del.mutate(item.id, { onError: () => show("No se pudo eliminar", "error") })}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        {/* línea 2: disponible · precio · categoría */}
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            on={item.available}
            onToggle={() => update.mutate({ itemId: item.id, data: { available: !item.available } }, onErr)}
            label={`Disponibilidad de ${item.name}`}
          />
          <div className="flex items-center gap-1 text-foreground/60">
            <span>$</span>
            <input
              type="number"
              min={0}
              defaultValue={item.price}
              onBlur={(e) => {
                const p = Number(e.target.value);
                if (!Number.isNaN(p) && p !== item.price) update.mutate({ itemId: item.id, data: { price: p } }, onErr);
              }}
              className="w-16 bg-transparent text-right text-foreground outline-none"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={item.station ?? "kitchen"}
              onChange={(e) => update.mutate({ itemId: item.id, data: { station: e.target.value as "kitchen" | "bar" } }, onErr)}
              className="rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-xs text-foreground outline-none"
              aria-label="Estación (Cocina o Barra)"
            >
              <option value="kitchen">Cocina</option>
              <option value="bar">Barra</option>
            </select>
            <select
              value={item.category_id ?? ""}
              onChange={(e) =>
                update.mutate(
                  { itemId: item.id, data: { category_id: e.target.value ? Number(e.target.value) : null } },
                  onErr,
                )
              }
              className="rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-xs text-foreground outline-none"
              aria-label="Categoría"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Card>
  );
}

function roleLabel(r: string) {
  return r === "owner" ? "Dueño" : r === "manager" ? "Gerente" : r === "waiter" ? "Mesero" : "Cocina";
}

type EmpPatch = Partial<Pick<Employee, "name" | "phone" | "position" | "hire_date" | "wage" | "status" | "notes">>;

function ProfileField({
  label,
  defaultValue,
  type = "text",
  onSave,
}: {
  label: string;
  defaultValue: string;
  type?: string;
  onSave: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-foreground/40">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== defaultValue) onSave(v);
        }}
        className="rounded-lg border border-foreground/15 bg-foreground/5 px-2.5 py-1.5 text-sm text-foreground outline-none"
      />
    </label>
  );
}

// Perfil de RH de un empleado (puesto, ingreso, pago, estado, contacto, notas).
function MemberProfile({
  email,
  emp,
  saving,
  onSave,
}: {
  email: string;
  emp?: Employee;
  saving: boolean;
  onSave: (patch: EmpPatch) => void;
}) {
  const isActive = (emp?.status ?? "active") === "active";
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-foreground/45">Perfil RH · {email}</p>
        {saving && <Spinner size="sm" color="current" />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ProfileField label="Puesto" defaultValue={emp?.position ?? ""} onSave={(v) => onSave({ position: v || null })} />
        <ProfileField label="Teléfono" defaultValue={emp?.phone ?? ""} onSave={(v) => onSave({ phone: v || null })} />
        <ProfileField label="Ingreso" type="date" defaultValue={emp?.hire_date ?? ""} onSave={(v) => onSave({ hire_date: v || null })} />
        <ProfileField label="Pago / hora" type="number" defaultValue={emp?.wage != null ? String(emp.wage) : ""} onSave={(v) => onSave({ wage: v ? Number(v) : null })} />
      </div>
      <ProfileField label="Notas" defaultValue={emp?.notes ?? ""} onSave={(v) => onSave({ notes: v || null })} />
      <div className="flex items-center gap-2">
        <Toggle on={isActive} onToggle={() => onSave({ status: isActive ? "inactive" : "active" })} label="Estado del empleado" />
        <span className="text-sm text-foreground/70">{isActive ? "Activo" : "Inactivo"}</span>
      </div>
    </div>
  );
}

const zoneSelectCls =
  "rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1 text-xs text-foreground outline-none";

const CURRENCIES = ["USD", "CAD", "EUR", "MXN", "COP", "GBP", "BRL", "ARS"];

// Configuración del negocio: nombre, tipo (bar/restaurante), moneda y módulos.
// Cada cambio se guarda al instante (PATCH); el nombre tiene botón Guardar.
function Settings({ business }: { business: Business }) {
  const update = useUpdateBusiness(business.id);
  const { show } = useToast();
  const [name, setName] = useState(business.name);
  const [currency, setCurrency] = useState(business.currency);

  // Re-sincroniza al cambiar de negocio (o si el server devuelve otro valor).
  useEffect(() => {
    setName(business.name);
    setCurrency(business.currency);
  }, [business.id, business.name, business.currency]);

  const set = new Set(business.features ?? []);
  const saved = (msg: string) => () => show(msg, "success");
  const failed = () => show("No se pudo guardar", "error");

  const toggleModule = (key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    update.mutate({ features: Array.from(next) }, { onError: failed });
  };

  const nameDirty = name.trim().length > 0 && name.trim() !== business.name;
  const saveName = () => {
    if (!nameDirty) return;
    update.mutate({ name: name.trim() }, { onSuccess: saved("Nombre actualizado"), onError: failed });
  };
  const changeMode = (m: ModeKey) => {
    if (m === business.mode) return;
    update.mutate({ mode: m }, { onSuccess: saved(`Tipo: ${presetFor(m).label}`), onError: failed });
  };
  const changeCurrency = (c: string) => {
    setCurrency(c);
    update.mutate(
      { currency: c },
      { onSuccess: saved(`Moneda: ${c}`), onError: () => { setCurrency(business.currency); failed(); } },
    );
  };

  const tileOn = "border-foreground/40 bg-foreground/10";
  const tileOff = "border-foreground/10 bg-foreground/[0.03] opacity-60";

  return (
    <section className="flex flex-col gap-5">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-foreground/50">
        <Cog className="size-3.5" /> Configuración del negocio
      </p>

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/70">Nombre</label>
        <div className="flex gap-2">
          <Input fullWidth value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del negocio" />
          <Button variant="primary" isDisabled={!nameDirty || update.isPending} onPress={saveName}>
            Guardar
          </Button>
        </div>
      </div>

      {/* Tipo de negocio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/70">Tipo de negocio</label>
        <div className="grid grid-cols-2 gap-2">
          {(["bar", "restaurant"] as ModeKey[]).map((m) => {
            const on = business.mode === m;
            const p = presetFor(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => changeMode(m)}
                className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition ${on ? tileOn : tileOff}`}
              >
                <p.Icon className="size-5 text-foreground" />
                <span className="text-sm font-semibold text-foreground">{p.label}</span>
                {on && <Check className="ml-auto size-4 text-foreground" />}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-foreground/40">
          Cambia la terminología ({presetFor(business.mode).terms.tables}) y qué parte del menú se muestra al comensal.
        </p>
      </div>

      {/* Moneda */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/70">Moneda</label>
        <select
          value={currency}
          onChange={(e) => changeCurrency(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Módulos */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground/70">Módulos activos</label>
        <p className="text-[11px] text-foreground/40">Enciende solo lo que usa tu negocio; el menú lateral y la app se adaptan.</p>
        <div className="grid grid-cols-2 gap-2">
          {MODULES.map((m) => {
            const on = set.has(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggleModule(m.key)}
                className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition ${on ? tileOn : tileOff}`}
              >
                <m.icon className="size-5 shrink-0 text-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{m.label}</span>
                  <span className="block truncate text-[11px] text-foreground/45">{m.desc}</span>
                </span>
                {on ? <Check className="size-4 shrink-0 text-foreground" /> : <Plus className="size-4 shrink-0 text-foreground/50" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Zones({ businessId }: { businessId: number }) {
  const floors = useFloors(businessId);
  const createFloor = useCreateFloor(businessId);
  const { show } = useToast();
  const [name, setName] = useState("");
  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wide text-foreground/50">Zonas / filas</p>
      <div className="flex items-stretch gap-2">
        <Input
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Salón A, Terraza, Fila 1"
        />
        <Button
          variant="secondary"
          isDisabled={createFloor.isPending}
          onPress={async () => {
            if (!name.trim()) return;
            await createFloor.mutateAsync(name.trim());
            setName("");
            show("Zona creada", "success");
          }}
        >
          Añadir
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {floors.data?.map((f) => (
          <span
            key={f.id}
            className="rounded-full border border-foreground/10 bg-foreground/[0.06] px-3 py-1.5 text-xs text-foreground/75"
          >
            {f.name}
          </span>
        ))}
        {!floors.data?.length && (
          <p className="text-sm text-foreground/40">
            Crea zonas para agrupar mesas y asignar meseros. Luego asigna la zona de cada mesa en el mapa, y la
            de cada mesero en Equipo.
          </p>
        )}
      </div>
    </section>
  );
}

function Staff({ businessId, features }: { businessId: number; features: string[] }) {
  const staff = useStaff(businessId);
  const invite = useInviteStaff(businessId);
  const addById = useAddStaffById(businessId);
  const removeStaff = useRemoveStaff(businessId);
  const cancelInvite = useCancelInvite(businessId);
  const changeRole = useChangeStaffRole(businessId);
  const floors = useFloors(businessId);
  const assignZone = useAssignZone(businessId);
  const { show } = useToast();
  const employees = useEmployees(businessId);
  const upsertEmp = useUpsertEmployee(businessId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "waiter" | "kitchen">("waiter");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userId, setUserId] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  // Roles invitables: gerente y mesero siempre; cocina solo si el módulo kitchen está activo.
  const kitchenOn = features.includes("kitchen");
  const roleOptions: ("manager" | "waiter" | "kitchen")[] = kitchenOn
    ? ["manager", "waiter", "kitchen"]
    : ["manager", "waiter"];
  useEffect(() => {
    if (!kitchenOn && role === "kitchen") setRole("waiter");
  }, [kitchenOn, role]);

  const empByEmail = new Map((employees.data ?? []).map((e) => [(e.email ?? "").toLowerCase(), e]));
  const members = staff.data?.staff ?? [];
  const invites = staff.data?.invites ?? [];

  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wide text-foreground/50">Equipo</p>

      {/* Invitar por email */}
      <div className="flex flex-col gap-2">
        <div className="flex items-stretch gap-2">
          <Input
            fullWidth
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@mesero.com"
          />
          <Button
            variant="primary"
            isDisabled={invite.isPending}
            onPress={async () => {
              if (!email.trim()) return show("Escribe un email", "error");
              try {
                await invite.mutateAsync({ email: email.trim(), role });
                setEmail("");
                show("Invitación creada (se activa cuando inicie sesión)", "success");
              } catch (e) {
                show(e instanceof Error ? e.message : "No se pudo invitar", "error");
              }
            }}
          >
            Invitar
          </Button>
        </div>
        <div className="flex gap-2">
          {roleOptions.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={role === r ? "primary" : "secondary"}
              className="rounded-full"
              onPress={() => setRole(r)}
            >
              <span className="flex items-center gap-1.5">
                {r === "waiter" ? (
                  <ConciergeBell className="size-4" />
                ) : r === "manager" ? (
                  <Briefcase className="size-4" />
                ) : (
                  <ChefHat className="size-4" />
                )}
                {roleLabel(r)}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Miembros + invitaciones pendientes */}
      <div className="flex flex-col gap-2">
        {members.map((m) => {
          const emp = m.email ? empByEmail.get(m.email.toLowerCase()) : undefined;
          return (
            <Card key={m.id} className="glass flex flex-col gap-2 rounded-2xl p-3">
              <div className="flex flex-row items-center justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => m.email && setExpanded(expanded === m.id ? null : m.id)}
                >
                  <p className="truncate font-medium text-foreground">{m.email ?? `${m.user_id.slice(0, 8)}…`}</p>
                  <p className="truncate text-xs text-foreground/40">
                    {roleLabel(m.role)}
                    {emp?.position ? ` · ${emp.position}` : ""}
                    {emp?.status === "inactive" ? " · inactivo" : ""}
                  </p>
                </button>
                {m.role !== "owner" && (
                  <div className="flex items-center gap-2">
                    {roleOptions.length > 1 && (
                  <select
                    value={m.role}
                    onChange={(e) => {
                      const to = e.target.value as "manager" | "waiter" | "kitchen";
                      if (to !== m.role)
                        changeRole.mutate(
                          { user_id: m.user_id, from_role: m.role, to_role: to },
                          { onError: () => show("No se pudo cambiar el rol", "error") },
                        );
                    }}
                    className={zoneSelectCls}
                    aria-label="Rol del empleado"
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={m.floor_id ?? ""}
                  onChange={(e) =>
                    assignZone.mutate({
                      userId: m.user_id,
                      role: m.role,
                      floorId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className={zoneSelectCls}
                  aria-label="Zona del mesero"
                >
                  <option value="">Sin zona</option>
                  {floors.data?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  className="text-foreground/40 transition hover:text-foreground"
                  aria-label={`Quitar ${m.email ?? m.user_id}`}
                  onClick={() =>
                    removeStaff.mutate(
                      { userId: m.user_id, role: m.role },
                      { onError: () => show("No se pudo quitar", "error") },
                    )
                  }
                >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              {expanded === m.id && m.email && (
                <MemberProfile
                  email={m.email}
                  emp={emp}
                  saving={upsertEmp.isPending}
                  onSave={(patch) =>
                    upsertEmp.mutate(
                      { email: m.email as string, ...patch },
                      { onError: () => show("No se pudo guardar", "error") },
                    )
                  }
                />
              )}
            </Card>
          );
        })}
        {invites.map((inv) => (
          <Card
            key={`inv-${inv.id}`}
            className="flex flex-row items-center justify-between rounded-2xl border border-dashed border-foreground/25 bg-foreground/[0.04] p-3"
          >
            <div>
              <p className="font-medium text-foreground">{inv.email}</p>
              <p className="text-xs text-foreground/55">{roleLabel(inv.role)} · pendiente</p>
            </div>
            <button
              className="text-foreground/40 transition hover:text-foreground"
              aria-label={`Cancelar invitación a ${inv.email}`}
              onClick={() => cancelInvite.mutate(inv.id)}
            >
              <Trash2 className="size-4" />
            </button>
          </Card>
        ))}
        {!members.length && !invites.length && (
          <EmptyHint icon={Users} text="Aún no hay equipo. Invita a tu primer mesero por email." />
        )}
      </div>

      {/* Avanzado: agregar por user_id */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="self-start text-xs text-foreground/40 hover:text-foreground/70"
      >
        {showAdvanced ? "Ocultar avanzado" : "Avanzado: agregar por ID de usuario"}
      </button>
      {showAdvanced && (
        <div className="flex items-stretch gap-2">
          <Input fullWidth value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_id (UUID)" />
          <Button
            variant="secondary"
            isDisabled={addById.isPending}
            onPress={async () => {
              if (!userId.trim()) return;
              try {
                await addById.mutateAsync({ user_id: userId.trim(), role });
                setUserId("");
                show("Staff agregado", "success");
              } catch (e) {
                show(e instanceof Error ? e.message : "No se pudo agregar", "error");
              }
            }}
          >
            Agregar
          </Button>
        </div>
      )}
    </section>
  );
}

// QR por mesa: descarga el PNG CON la sesión del staff (el endpoint sigue
// protegido) y lo muestra como miniatura descargable/imprimible.
function TableQR({ businessId, tableId, label }: { businessId: number; tableId: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let obj: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
        const res = await fetch(`${API_URL}/businesses/${businessId}/tables/${tableId}/qr.png`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });
        if (!res.ok) return;
        const blob = await res.blob();
        obj = URL.createObjectURL(blob);
        if (!cancelled) setSrc(obj);
      } catch {
        /* QR best-effort */
      }
    })();
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [businessId, tableId]);

  if (!src) return <div className="h-12 w-12 shrink-0 animate-pulse rounded-md bg-foreground/10" />;
  return (
    <a href={src} download={`qr-${label}.png`} title={`Descargar QR de ${label}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* El QR SIEMPRE va sobre blanco (negro-sobre-blanco) para que escanee en cualquier tema */}
      <img src={src} alt={`QR ${label}`} className="h-12 w-12 rounded-md p-1" style={{ backgroundColor: "#fff" }} />
    </a>
  );
}

function EmptyHint({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-foreground/10 p-6 text-center">
      <Icon className="size-7 text-foreground/40" />
      <p className="text-sm text-foreground/40">{text}</p>
    </div>
  );
}
