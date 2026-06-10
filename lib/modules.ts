// Catálogo de características/módulos que un negocio puede activar en el Setup.
// El negocio guarda en `business.features` las claves activas; de aquí come:
//   1. el Setup (grilla de toggles),
//   2. el SIDEBAR (cada módulo activo aparece en la navegación, con su pantalla),
//   3. (a futuro) las secciones profundas por módulo.
// Todo relacionado: enciendes un módulo en el Setup → aparece en el sidebar.

import {
  Bike,
  ChefHat,
  ConciergeBell,
  HandHelping,
  type LucideIcon,
  Martini,
  Soup,
  SquareParking,
  Star,
  Users,
  Wallet,
} from "lucide-react";

import type { StaffRole } from "./types";

export type ModuleKey =
  | "reception"
  | "kitchen"
  | "bar"
  | "buffet"
  | "vip"
  | "parking"
  | "delivery"
  | "services"
  | "crm";

export type ModuleDef = {
  key: ModuleKey;
  label: string; // nombre largo (Setup)
  navLabel: string; // nombre corto (sidebar)
  icon: LucideIcon;
  desc: string;
  href: string; // a dónde lleva en el sidebar
  roles: StaffRole[]; // quién lo ve
};

export const MODULES: ModuleDef[] = [
  { key: "reception", label: "Recepción y caja", navLabel: "Caja", icon: Wallet, desc: "Caja, cobros y reportes", href: "/caja", roles: ["owner"] },
  { key: "kitchen", label: "Cocina", navLabel: "Cocina", icon: ChefHat, desc: "Pantalla de cocina (KDS)", href: "/kitchen", roles: ["owner", "manager", "kitchen"] },
  { key: "bar", label: "Bar / licorería", navLabel: "Bar", icon: Martini, desc: "Carta de barra y bebidas", href: "/m/bar", roles: ["owner", "manager", "waiter"] },
  { key: "buffet", label: "Buffet", navLabel: "Buffet", icon: Soup, desc: "Servicio tipo buffet", href: "/m/buffet", roles: ["owner", "manager", "waiter"] },
  { key: "vip", label: "Zona VIP", navLabel: "VIP", icon: Star, desc: "Área / mesas VIP", href: "/m/vip", roles: ["owner", "manager", "waiter"] },
  { key: "parking", label: "Estacionamiento", navLabel: "Parking", icon: SquareParking, desc: "Valet / parqueo", href: "/m/parking", roles: ["owner", "manager"] },
  { key: "delivery", label: "Delivery / para llevar", navLabel: "Delivery", icon: Bike, desc: "Pedidos para llevar", href: "/m/delivery", roles: ["owner", "manager", "waiter"] },
  { key: "services", label: "Servicios", navLabel: "Servicios", icon: HandHelping, desc: "Servicios adicionales", href: "/m/services", roles: ["owner", "manager", "waiter"] },
  { key: "crm", label: "Clientes (CRM)", navLabel: "Clientes", icon: Users, desc: "Base de clientes, historial y CSV", href: "/m/crm", roles: ["owner"] },
];

export const MODULE_BY_KEY: Record<string, ModuleDef> = Object.fromEntries(
  MODULES.map((m) => [m.key, m]),
);
