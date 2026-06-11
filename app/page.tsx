"use client";
// Landing promocional pública de Connek Food. El comensal entra por /t/[token]
// (QR); el staff/dueño entra desde aquí → login → panel.

import { Button } from "@heroui/react";
import {
  Bike,
  ChefHat,
  ConciergeBell,
  HandHelping,
  Martini,
  QrCode,
  Smartphone,
  Soup,
  SquareParking,
  Star,
  Users,
  UtensilsCrossed,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { PRIVACY } from "@/lib/privacyPolicy";
import { TERMS } from "@/lib/termsOfService";

const FEATURES = [
  { icon: QrCode, title: "Pedidos por QR", desc: "Cada mesa con su código: el comensal ve el menú con fotos y video, y pide desde su teléfono." },
  { icon: ConciergeBell, title: "Salón en vivo", desc: "El mesero ve el mapa de mesas, toma pedidos, atiende llamadas y cobra en segundos." },
  { icon: ChefHat, title: "Cocina KDS", desc: "Los pedidos llegan a cocina al instante; marca preparando → listo → servir." },
  { icon: Wallet, title: "Caja y reportes", desc: "Turnos de caja, métodos de pago, descuentos, propinas, dividir cuenta y exportación." },
  { icon: Users, title: "CRM + Equipo (RH)", desc: "Clientes, reseñas y segmentos; gestiona meseros y gerentes con sus permisos." },
  { icon: Zap, title: "Tiempo real + instalable", desc: "Todo se sincroniza solo entre dispositivos. Se instala como app (PWA) en PC y teléfono." },
];

const MODULES = [
  { icon: Martini, label: "Bar" },
  { icon: Soup, label: "Buffet" },
  { icon: Star, label: "VIP" },
  { icon: SquareParking, label: "Parking" },
  { icon: Bike, label: "Delivery" },
  { icon: HandHelping, label: "Servicios" },
];

export default function Landing() {
  const { session } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  const enter = () => router.push(session ? "/home" : "/login");

  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="safe-pt sticky top-0 z-20 flex items-center justify-between px-5 py-4 backdrop-blur">
        <span className="flex items-center gap-2 font-bold">
          <UtensilsCrossed className="size-5" /> Connek Food
        </span>
        <Button size="sm" variant="primary" className="rounded-full" onPress={enter}>
          {session ? "Ir al panel" : "Entrar"}
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-16 pt-10 text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-foreground text-background">
          <UtensilsCrossed className="size-8" />
        </span>
        <h1 className="text-balance text-4xl font-black leading-tight sm:text-6xl">
          Tu bar o restaurante, <span className="text-foreground/50">en piloto automático.</span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-lg text-foreground/65">
          Connek Food es el sistema completo: pedidos por QR, salón, cocina, caja y módulos —
          todo en <span className="text-foreground">tiempo real</span> y listo para instalar como app.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="primary" className="rounded-full px-8" onPress={enter}>
            {session ? "Ir al panel" : "Empieza gratis"}
          </Button>
          <Button size="lg" variant="secondary" className="rounded-full px-8" onPress={() => router.push("/login")}>
            Iniciar sesión
          </Button>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-foreground/40">
          <Smartphone className="size-3.5" /> Funciona en PC, tablet y teléfono · sin instalar nada para tus clientes
        </p>
      </section>

      {/* Qué puedes hacer */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.2em] text-foreground/40">Todo en un solo lugar</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass flex flex-col gap-2 rounded-3xl p-5">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-foreground/[0.06]">
                <f.icon className="size-5" />
              </span>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Módulos */}
      <section className="mx-auto max-w-3xl px-5 pb-16 text-center">
        <h2 className="text-2xl font-bold">Activa solo lo que tu negocio necesita</h2>
        <p className="mt-2 text-foreground/55">Modo Bar 🍸 o Restaurante 🍽️ — y enciende módulos con un clic.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {MODULES.map((m) => (
            <span key={m.label} className="flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm">
              <m.icon className="size-4" /> {m.label}
            </span>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="flex flex-col items-center gap-4 rounded-[2rem] bg-foreground px-6 py-12 text-center text-background">
          <h2 className="text-balance text-3xl font-black">Monta tu negocio en minutos</h2>
          <p className="max-w-md text-background/70">
            Crea tu negocio, siembra tu menú y mesas con un asistente, y empieza a recibir pedidos hoy.
          </p>
          <Button size="lg" variant="secondary" className="rounded-full px-8" onPress={enter}>
            {session ? "Ir al panel" : "Crear mi negocio"}
          </Button>
        </div>
      </section>

      <footer className="safe-pb flex flex-col items-center gap-2 border-t border-foreground/10 px-5 py-8 text-center text-sm text-foreground/40">
        <span className="flex items-center justify-center gap-1.5">
          <UtensilsCrossed className="size-4" /> Connek Food · connekeats.ca
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link href="/privacy" className="text-foreground/40 underline transition hover:text-foreground/70">
            {PRIVACY.link[locale]}
          </Link>
          <Link href="/terms" className="text-foreground/40 underline transition hover:text-foreground/70">
            {TERMS.link[locale]}
          </Link>
        </div>
      </footer>
    </main>
  );
}
