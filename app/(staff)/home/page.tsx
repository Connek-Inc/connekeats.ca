"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { Armchair, ChefHat, ConciergeBell, Hand, LayoutGrid, QrCode, Receipt, Settings, TrendingUp, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { useBills, useBusinesses, useOrders, useSalesSummary, useTables } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { presetFor } from "@/lib/modePresets";

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
const ACTIVE_ORDER = ["open", "sent", "preparing", "ready", "served"];

export default function HomePage() {
  const { user, roles } = useAuth();
  const { businessId, setBusinessId } = useBusiness();
  const businesses = useBusinesses();
  const router = useRouter();
  const t = useT();
  const [pickTable, setPickTable] = useState(false); // selector de mesa para "Vista cliente"

  useEffect(() => {
    if (!businessId && businesses.data?.length) setBusinessId(businesses.data[0].id);
  }, [businessId, businesses.data, setBusinessId]);

  // Onboarding solo si REALMENTE no hay negocios (esperar a que la query se asiente).
  useEffect(() => {
    if (businesses.isSuccess && !businesses.isFetching && (businesses.data?.length ?? 0) === 0) {
      router.replace("/onboarding");
    }
  }, [businesses.isSuccess, businesses.isFetching, businesses.data, router]);

  const active = businesses.data?.find((b) => b.id === businessId) ?? null;
  const features = active?.features ?? [];
  const myRoles = roles.filter((r) => r.business_id === active?.id).map((r) => r.role);
  const isOwner = myRoles.includes("owner");
  const canManage = isOwner || myRoles.includes("manager");
  const canWaiter = canManage || myRoles.includes("waiter");
  const canKitchen = (canManage || myRoles.includes("kitchen")) && features.includes("kitchen");

  // ── Información general del negocio activo (KPIs) ──
  const sales = useSalesSummary(isOwner ? businessId : null, "today");
  const tables = useTables(businessId);
  const orders = useOrders(businessId);
  const bills = useBills(canWaiter ? businessId : null);

  const totalTables = tables.data?.length ?? 0;
  const occupied = (tables.data ?? []).filter((t) => t.status !== "available").length;
  const activeOrders = (orders.data ?? []).filter((o) => ACTIVE_ORDER.includes(o.status)).length;
  const pending = (bills.data ?? []).filter((b) => b.status === "pending");
  const pendingSum = pending.reduce((s, b) => s + (Number(b.total) || 0), 0);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <header className="mb-6">
        <p className="flex items-center gap-1.5 text-sm text-foreground/55">
          Hola <Hand className="size-4" />
        </p>
        <h1 className="text-2xl font-bold text-foreground">{user?.email?.split("@")[0] ?? "Staff"}</h1>
      </header>

      {businesses.isLoading ? (
        <Spinner color="accent" />
      ) : !businesses.data?.length ? (
        <Card className="glass flex flex-col gap-3 rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-foreground">{t("home.firstBusinessTitle")}</h2>
          <p className="text-foreground/60">{t("home.firstBusinessSub")}</p>
          <Button variant="primary" onPress={() => router.push("/onboarding")}>
            {t("home.createBusiness")}
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {/* ── Selector de negocio ── */}
          <section className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wide text-foreground/50">{t("home.business")}</label>
            <div className="flex items-center gap-2">
              <select
                value={businessId ?? ""}
                onChange={(e) => setBusinessId(Number(e.target.value))}
                className="flex-1 rounded-2xl border border-foreground/15 bg-foreground/[0.04] px-4 py-3 text-base font-semibold text-foreground outline-none"
                aria-label="Cambiar de negocio"
              >
                {businesses.data.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {presetFor(b.mode).label}
                  </option>
                ))}
              </select>
              <Button isIconOnly variant="secondary" className="rounded-2xl" aria-label="Crear negocio" onPress={() => router.push("/onboarding?new=1")}>
                +
              </Button>
            </div>
          </section>

          {/* ── Información general (KPIs) ── */}
          {active && (
            <section className="grid grid-cols-2 gap-3">
              {isOwner && (
                <Kpi icon={TrendingUp} label={t("home.salesToday")} value={money(sales.data?.revenue ?? 0)} sub={`${sales.data?.count ?? 0} ${t("home.orders")}`} loading={sales.isLoading} />
              )}
              <Kpi icon={Armchair} label={t("home.tables")} value={`${occupied}/${totalTables}`} sub={t("home.occupied")} loading={tables.isLoading} />
              <Kpi icon={ConciergeBell} label={t("home.activeOrders")} value={String(activeOrders)} loading={orders.isLoading} />
              {canWaiter && (
                <Kpi icon={Receipt} label={t("home.toCollect")} value={String(pending.length)} sub={money(pendingSum)} loading={bills.isLoading} />
              )}
            </section>
          )}

          {/* ── Acciones rápidas ── */}
          {active && canWaiter && (
            <section className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-foreground/50">{t("home.quickActions")}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/waiter")}
                  className="glass flex flex-col items-start gap-1 rounded-3xl p-4 text-left transition hover:bg-foreground/10"
                >
                  <LayoutGrid className="size-6 text-foreground" />
                  <span className="font-semibold text-foreground">{t("home.tables")}</span>
                  <span className="text-xs text-foreground/50">{t("home.tablesSub")}</span>
                </button>
                <button
                  onClick={() => setPickTable((v) => !v)}
                  className={`glass flex flex-col items-start gap-1 rounded-3xl p-4 text-left transition hover:bg-foreground/10 ${pickTable ? "border-foreground/40 bg-foreground/10" : ""}`}
                >
                  <QrCode className="size-6 text-foreground" />
                  <span className="font-semibold text-foreground">{t("home.clientView")}</span>
                  <span className="text-xs text-foreground/50">{t("home.clientViewSub")}</span>
                </button>
              </div>
              {pickTable && (
                <Card className="glass flex max-h-60 flex-col gap-0.5 overflow-y-auto rounded-2xl p-2">
                  {tables.data?.length ? (
                    tables.data.map((tbl) => (
                      <button
                        key={tbl.id}
                        onClick={() => {
                          window.open(`/t/${tbl.qr_token}`, "_blank");
                          setPickTable(false);
                        }}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-foreground/80 transition hover:bg-foreground/10"
                      >
                        <span className="font-medium text-foreground">{tbl.label}</span>
                        <span className="text-xs text-foreground/45">{t("home.openClientView")} →</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-foreground/40">{t("home.noTables")}</p>
                  )}
                </Card>
              )}
            </section>
          )}

          {/* ── Operación ── */}
          {active && (
            <section className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-foreground/50">{t("home.operation")} — {active.name}</p>
              {canWaiter && (
                <Button variant="primary" size="lg" onPress={() => router.push("/waiter")}>
                  <span className="flex items-center justify-center gap-2">
                    <ConciergeBell className="size-5" /> {t("nav.waiter")}
                  </span>
                </Button>
              )}
              {canKitchen && (
                <Button variant="secondary" size="lg" onPress={() => router.push("/kitchen")}>
                  <span className="flex items-center justify-center gap-2">
                    <ChefHat className="size-5" /> {t("nav.kitchen")}
                  </span>
                </Button>
              )}
              {canManage && (
                <Button variant="secondary" size="lg" onPress={() => router.push("/owner")}>
                  <span className="flex items-center justify-center gap-2">
                    <Settings className="size-5" /> Setup ({presetFor(active.mode).terms.tables}, {presetFor(active.mode).terms.menu}, QRs · equipo)
                  </span>
                </Button>
              )}
              {isOwner && features.includes("reception") && (
                <Button variant="secondary" size="lg" onPress={() => router.push("/caja")}>
                  <span className="flex items-center justify-center gap-2">
                    <Wallet className="size-5" /> {t("home.caja")}
                  </span>
                </Button>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: typeof Hand;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card className="glass flex flex-col gap-1 rounded-3xl p-4">
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-foreground/45">
        <Icon className="size-3.5" /> {label}
      </span>
      {loading ? (
        <Spinner color="current" size="sm" />
      ) : (
        <p className="text-2xl font-black leading-none text-foreground">{value}</p>
      )}
      {sub && <p className="text-xs text-foreground/50">{sub}</p>}
    </Card>
  );
}
