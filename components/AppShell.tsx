"use client";
// Shell del panel admin: sidebar en desktop, menú hamburguesa (drawer) en móvil.
// Navegación filtrada por ROL (owner/waiter/kitchen) del negocio activo.

import { ConciergeBell, Home, type LucideIcon, Menu, Settings, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { LangSwitcher } from "@/components/LangSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { BrandStyle } from "@/lib/brand";
import { useT } from "@/lib/i18n";
import { useBusiness } from "@/lib/business";
import { useBusinesses } from "@/lib/hooks";
import { MODULES } from "@/lib/modules";
import type { StaffRole } from "@/lib/types";

type NavItem = { href: string; label: string; icon: LucideIcon; roles: StaffRole[] };

// Navegación FIJA (no depende de módulos). Los módulos activos se insertan en medio.
const BASE_TOP: NavItem[] = [
  { href: "/home", label: "Inicio", icon: Home, roles: ["owner", "manager", "waiter", "kitchen"] },
  { href: "/waiter", label: "Mesero", icon: ConciergeBell, roles: ["owner", "manager", "waiter"] },
];
const SETUP_ITEM: NavItem = { href: "/owner", label: "Setup", icon: Settings, roles: ["owner", "manager"] };

export function AppShell({ children }: { children: React.ReactNode }) {
  const { roles, signOut, user } = useAuth();
  const { businessId, setBusinessId } = useBusiness();
  const businesses = useBusinesses();
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = useState(false);
  // Traduce las etiquetas de navegación base (los módulos conservan su nombre).
  const navLabel = (href: string, fallback: string) =>
    href === "/home" ? t("nav.home") : href === "/waiter" ? t("nav.waiter") : href === "/owner" ? t("nav.setup") : fallback;

  const active = businesses.data?.find((b) => b.id === businessId) ?? null;
  const features = active?.features ?? [];
  const myRoles = roles.filter((r) => r.business_id === businessId).map((r) => r.role);
  const isOwner = myRoles.includes("owner");

  // El sidebar es ESPEJO del setup: Inicio + Mesero, luego cada módulo ACTIVO
  // (en el orden del catálogo), y Setup al final. Cada uno además filtrado por rol.
  const moduleItems: NavItem[] = MODULES.filter((m) => features.includes(m.key)).map((m) => ({
    href: m.href,
    label: m.navLabel,
    icon: m.icon,
    roles: m.roles,
  }));
  const items = [...BASE_TOP, ...moduleItems, SETUP_ITEM].filter(
    (it) => it.href === "/home" || it.roles.some((r) => (r === "owner" ? isOwner : myRoles.includes(r))),
  );

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const navList = (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const activeRoute = pathname === it.href;
        return (
          <button
            key={it.href}
            onClick={() => go(it.href)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
              activeRoute ? "bg-foreground font-semibold text-background" : "text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            <it.icon className="size-[18px] shrink-0" />
            <span>{navLabel(it.href, it.label)}</span>
          </button>
        );
      })}
    </nav>
  );

  const businessSwitcher =
    businesses.data && businesses.data.length > 0 ? (
      <select
        value={businessId ?? ""}
        onChange={(e) => setBusinessId(Number(e.target.value))}
        className="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1.5 text-sm text-foreground outline-none"
      >
        {businesses.data.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    ) : null;

  const footer = (
    <div className="mt-auto flex flex-col gap-3">
      {businessSwitcher}
      <LangSwitcher />
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-foreground/45">{user?.email}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="rounded-full border border-foreground/15 px-3 py-1.5 text-xs text-foreground/70 transition hover:bg-foreground/10 hover:text-foreground"
          >
            {t("nav.signout")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:flex">
      {/* Aplica la marca (colores/tipografía) del negocio activo en runtime */}
      <BrandStyle business={active} />
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 border-r border-foreground/10 bg-surface/40 p-4 lg:flex">
        <Brand logoUrl={active?.logo_url} name={active?.name} />
        {navList}
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (móvil/tablet) */}
        <header className="safe-pt sticky top-0 z-30 flex items-center justify-between border-b border-foreground/10 bg-background/80 px-4 pb-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="text-foreground">
            <Menu className="size-6" />
          </button>
          <Brand logoUrl={active?.logo_url} name={active?.name} />
          <ThemeToggle />
        </header>

        {/* Drawer (móvil/tablet) */}
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="safe-pt absolute left-0 top-0 flex h-full w-72 flex-col gap-5 bg-surface p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <Brand logoUrl={active?.logo_url} name={active?.name} />
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="text-foreground/60 hover:text-foreground">
                  <X className="size-5" />
                </button>
              </div>
              {navList}
              {footer}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
