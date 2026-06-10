"use client";
// Dashboard real por MÓDULO del negocio (bar, buffet, vip, parking, delivery,
// services). El sidebar refleja los módulos activos del Setup y cada uno abre
// aquí: un panel con datos en vivo del negocio, qué se gestiona y accesos a las
// herramientas reales. Las herramientas profundas de cada módulo se construyen
// encima de este marco.

import { Button, Card } from "@heroui/react";
import { ArrowRight, Check, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { BarBoard } from "@/components/BarBoard";
import { BuffetBoard } from "@/components/BuffetBoard";
import { CrmBoard } from "@/components/CrmBoard";
import { DeliveryBoard } from "@/components/DeliveryBoard";
import { ParkingBoard } from "@/components/ParkingBoard";
import { ServicesBoard } from "@/components/ServicesBoard";
import { VipBoard } from "@/components/VipBoard";
import { useBusiness } from "@/lib/business";
import { useBusinesses, useOrders, useTables } from "@/lib/hooks";
import { MODULE_BY_KEY } from "@/lib/modules";

const ACTIVE_ORDER = ["open", "sent", "preparing", "ready", "served"];

type Detail = { blurb: string; manage: string[]; links: { label: string; href: string }[] };

const MODULE_DETAIL: Record<string, Detail> = {
  bar: {
    blurb: "Tu barra: carta de bebidas y rondas rápidas por puesto.",
    manage: ["Carta de cócteles y bebidas", "Rondas y cuenta por puesto", "Avisos de la barra"],
    links: [
      { label: "Tomar pedido", href: "/waiter" },
      { label: "Editar carta", href: "/owner" },
    ],
  },
  buffet: {
    blurb: "Servicio tipo buffet: turnos y reposición de estaciones.",
    manage: ["Turnos y estaciones", "Reposición de bandejas", "Control del salón"],
    links: [
      { label: "Salón", href: "/waiter" },
      { label: "Mesas", href: "/owner" },
    ],
  },
  vip: {
    blurb: "Atención premium en tu zona VIP.",
    manage: ["Mesas / área VIP", "Atención prioritaria", "Reservas VIP"],
    links: [
      { label: "Salón", href: "/waiter" },
      { label: "Zonas", href: "/owner" },
    ],
  },
  parking: {
    blurb: "Valet y estacionamiento de tus clientes.",
    manage: ["Registro de vehículos", "Entrega de llaves", "Cobro de parqueo"],
    links: [{ label: "Caja & Reportes", href: "/caja" }],
  },
  delivery: {
    blurb: "Pedidos para llevar y a domicilio.",
    manage: ["Pedidos para llevar", "Seguimiento de entregas", "Repartidores"],
    links: [
      { label: "Pedidos", href: "/waiter" },
      { label: "Carta", href: "/owner" },
    ],
  },
  services: {
    blurb: "Servicios adicionales para tus clientes.",
    manage: ["Solicitudes de servicio", "Catálogo de extras", "Atenciones especiales"],
    links: [{ label: "Avisos", href: "/waiter" }],
  },
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-foreground/45">{label}</p>
    </div>
  );
}

export default function ModulePage() {
  const params = useParams<{ module: string }>();
  const router = useRouter();
  const { businessId } = useBusiness();
  const businesses = useBusinesses();
  const tables = useTables(businessId);
  const orders = useOrders(businessId);

  const active = businesses.data?.find((b) => b.id === businessId) ?? null;
  const key = String(params.module ?? "");
  const mod = MODULE_BY_KEY[key];
  const enabled = (active?.features ?? []).includes(key);
  const detail = MODULE_DETAIL[key];

  if (!mod) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-8">
        <Card className="glass rounded-3xl p-8 text-center text-foreground/60">Módulo desconocido.</Card>
      </main>
    );
  }
  const Icon = mod.icon;
  const tableList = tables.data ?? [];
  const occupied = tableList.filter((t) => t.status === "occupied" || t.status === "bill_requested").length;
  const openOrders = (orders.data ?? []).filter((o) => ACTIVE_ORDER.includes(o.status)).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-foreground">{mod.label}</h1>
          <p className="text-sm text-foreground/50">{detail?.blurb ?? mod.desc}</p>
        </div>
      </header>

      {!enabled ? (
        <Card className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
          <Icon className="size-10 text-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">Este módulo no está activo</h2>
          <p className="text-foreground/55">Actívalo en el Setup del negocio para empezar a usarlo.</p>
          <Button variant="primary" onPress={() => router.push("/owner")}>
            <span className="flex items-center justify-center gap-2">
              <Settings className="size-4" /> Ir al Setup
            </span>
          </Button>
        </Card>
      ) : key === "bar" ? (
        <BarBoard businessId={businessId!} />
      ) : key === "parking" ? (
        <ParkingBoard businessId={businessId!} />
      ) : key === "buffet" ? (
        <BuffetBoard businessId={businessId!} />
      ) : key === "delivery" ? (
        <DeliveryBoard businessId={businessId!} />
      ) : key === "vip" ? (
        <VipBoard businessId={businessId!} />
      ) : key === "services" ? (
        <ServicesBoard businessId={businessId!} />
      ) : key === "crm" ? (
        <CrmBoard businessId={businessId!} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Snapshot en vivo del negocio */}
          <section>
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Ahora mismo</p>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Mesas" value={tableList.length} />
              <Stat label="Ocupadas" value={occupied} />
              <Stat label="Pedidos activos" value={openOrders} />
            </div>
          </section>

          {/* Qué gestionas aquí */}
          {detail && (
            <section>
              <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Qué gestionas aquí</p>
              <Card className="glass flex flex-col gap-2 rounded-2xl p-4">
                {detail.manage.map((m) => (
                  <span key={m} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="size-4 shrink-0 text-foreground/60" /> {m}
                  </span>
                ))}
              </Card>
            </section>
          )}

          {/* Accesos directos a las herramientas reales */}
          {detail && detail.links.length > 0 && (
            <section>
              <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Accesos</p>
              <div className="flex flex-col gap-2">
                {detail.links.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => router.push(l.href)}
                    className="flex items-center justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-left transition hover:bg-foreground/[0.07]"
                  >
                    <span className="text-sm font-medium text-foreground">{l.label}</span>
                    <ArrowRight className="size-4 text-foreground/40" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <p className="text-center text-[11px] text-foreground/40">
            Panel dedicado de {mod.label} — más herramientas en camino.
          </p>
        </div>
      )}
    </main>
  );
}
