"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { ChefHat, ConciergeBell, Hand, Settings, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { useBusinesses } from "@/lib/hooks";
import { presetFor } from "@/lib/modePresets";

export default function HomePage() {
  const { user, roles } = useAuth();
  const { businessId, setBusinessId } = useBusiness();
  const businesses = useBusinesses();
  const router = useRouter();

  useEffect(() => {
    if (!businessId && businesses.data?.length) setBusinessId(businesses.data[0].id);
  }, [businessId, businesses.data, setBusinessId]);

  // Onboarding: solo si el usuario REALMENTE no tiene negocios. Esperamos a que
  // la query se ASIENTE (isFetched && !isFetching) para no rebotar al wizard
  // mientras react-query aún tiene cacheada la lista vacía y está recargando
  // (esa carrera causaba el "siempre me quedo en el onboarding").
  useEffect(() => {
    if (businesses.isSuccess && !businesses.isFetching && (businesses.data?.length ?? 0) === 0) {
      router.replace("/onboarding");
    }
  }, [businesses.isSuccess, businesses.isFetching, businesses.data, router]);

  const active = businesses.data?.find((b) => b.id === businessId) ?? null;
  const features = active?.features ?? [];
  const myRoles = roles.filter((r) => r.business_id === active?.id).map((r) => r.role);
  const isOwner = myRoles.includes("owner");
  const canManage = isOwner || myRoles.includes("manager"); // dueño o gerente
  const canWaiter = canManage || myRoles.includes("waiter");
  const canKitchen = (canManage || myRoles.includes("kitchen")) && features.includes("kitchen");

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
          <h2 className="text-lg font-semibold text-foreground">Crea tu primer negocio</h2>
          <p className="text-foreground/60">Elige modo bar o restaurante, agrega mesas y menú, y genera los QR.</p>
          <Button variant="primary" onPress={() => router.push("/onboarding")}>
            Crear negocio
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <section>
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">Negocios</p>
            <div className="flex flex-col gap-2">
              {businesses.data.map((b) => {
                const p = presetFor(b.mode);
                return (
                  <button key={b.id} onClick={() => setBusinessId(b.id)} className="text-left">
                    <Card
                      className={`rounded-3xl p-4 transition ${
                        b.id === businessId ? "border-foreground/40 bg-foreground/10" : "glass"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-foreground">{b.name}</p>
                          <p className="flex items-center gap-1.5 text-foreground/55">
                            <p.Icon className="size-4" /> {p.label}
                          </p>
                        </div>
                        {b.id === businessId && (
                          <span className="flex items-center gap-1.5 text-sm text-foreground/70">
                            <span className="size-2 rounded-full bg-foreground" /> activo
                          </span>
                        )}
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </section>

          {active && (
            <section className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-foreground/50">Operación — {active.name}</p>
              {canWaiter && (
                <Button variant="primary" size="lg" onPress={() => router.push("/waiter")}>
                  <span className="flex items-center justify-center gap-2">
                    <ConciergeBell className="size-5" /> Mesero
                  </span>
                </Button>
              )}
              {canKitchen && (
                <Button variant="secondary" size="lg" onPress={() => router.push("/kitchen")}>
                  <span className="flex items-center justify-center gap-2">
                    <ChefHat className="size-5" /> Cocina
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
                    <Wallet className="size-5" /> Caja & Reportes
                  </span>
                </Button>
              )}
            </section>
          )}

          <button onClick={() => router.push("/onboarding?new=1")} className="text-center text-foreground/70">
            + Crear otro negocio
          </button>
        </div>
      )}
    </main>
  );
}
