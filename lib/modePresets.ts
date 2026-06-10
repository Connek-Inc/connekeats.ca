// Fuente ÚNICA de lo que distingue un bar de un restaurante.
// De aquí comen: el wizard de onboarding, el preview en vivo y la pantalla del
// comensal (/t/[token]). Cambiar el modo de un negocio cambia, de verdad:
//   1. la carta inicial (plantilla de menú),
//   2. la terminología de la UI del staff,
//   3. los accesos rápidos que ve el comensal.

import {
  Beer,
  Citrus,
  ConciergeBell,
  Croissant,
  CreditCard,
  type LucideIcon,
  Martini,
  ScrollText,
  Snowflake,
  UtensilsCrossed,
} from "lucide-react";

import type { BusinessMode } from "./types";

export type ModeKey = BusinessMode; // "bar" | "restaurant"

/** Acción rápida del comensal en /t/[token]. `kind` decide a qué endpoint pega. */
export type QuickAction =
  | { id: string; label: string; icon: LucideIcon; kind: "call_waiter" }
  | { id: string; label: string; icon: LucideIcon; kind: "request_item"; text: string }
  | { id: string; label: string; icon: LucideIcon; kind: "bill" };

export type TemplateItem = { name: string; price: number; description?: string };
export type TemplateCategory = { category: string; items: TemplateItem[] };

export type ModePreset = {
  Icon: LucideIcon;
  label: string; // "Bar" | "Restaurante"
  tagline: string; // frase corta para la card del wizard
  /** Terminología para la UI del staff (titulares y labels de alta visibilidad). */
  terms: { venue: string; table: string; tables: string; order: string; menu: string };
  /** Carta inicial editable en el wizard (se siembra con available_in = modo). */
  menuTemplate: TemplateCategory[];
  /** Accesos rápidos del comensal. */
  quickActions: QuickAction[];
  tableDefaults: { labelPrefix: string; capacity: number };
};

export const MODE_PRESETS: Record<ModeKey, ModePreset> = {
  bar: {
    Icon: Martini,
    label: "Bar",
    tagline: "Barra, rondas y cuenta abierta. Carta de cócteles lista.",
    terms: { venue: "barra", table: "puesto", tables: "puestos", order: "ronda", menu: "carta" },
    menuTemplate: [
      {
        category: "Cócteles",
        items: [
          { name: "Mojito", price: 8 },
          { name: "Margarita", price: 9 },
          { name: "Gin Tonic", price: 9 },
          { name: "Piña Colada", price: 8 },
        ],
      },
      {
        category: "Cervezas",
        items: [
          { name: "Lager", price: 5 },
          { name: "IPA", price: 6 },
          { name: "Artesanal", price: 7 },
        ],
      },
      {
        category: "Shots",
        items: [
          { name: "Tequila", price: 4 },
          { name: "Jäger", price: 5 },
        ],
      },
      {
        category: "Snacks",
        items: [
          { name: "Nachos", price: 7 },
          { name: "Alitas", price: 9 },
        ],
      },
    ],
    quickActions: [
      { id: "ice", label: "Hielo", icon: Snowflake, kind: "request_item", text: "hielo" },
      { id: "lime", label: "Limón", icon: Citrus, kind: "request_item", text: "limón" },
      { id: "round", label: "Otra ronda", icon: Beer, kind: "call_waiter" },
      { id: "bill", label: "La cuenta", icon: CreditCard, kind: "bill" },
    ],
    tableDefaults: { labelPrefix: "Barra", capacity: 4 },
  },
  restaurant: {
    Icon: UtensilsCrossed,
    label: "Restaurante",
    tagline: "Salón, comandas por turnos. Menú de entradas a postres.",
    terms: { venue: "salón", table: "mesa", tables: "mesas", order: "comanda", menu: "menú" },
    menuTemplate: [
      {
        category: "Entradas",
        items: [
          { name: "Ensalada César", price: 7 },
          { name: "Sopa del día", price: 6 },
          { name: "Bruschetta", price: 6 },
        ],
      },
      {
        category: "Platos fuertes",
        items: [
          { name: "Hamburguesa", price: 12 },
          { name: "Pasta Alfredo", price: 11 },
          { name: "Salmón a la plancha", price: 16 },
          { name: "Pollo al grill", price: 13 },
        ],
      },
      {
        category: "Postres",
        items: [
          { name: "Cheesecake", price: 6 },
          { name: "Brownie", price: 5 },
        ],
      },
      {
        category: "Bebidas",
        items: [
          { name: "Limonada", price: 3 },
          { name: "Café", price: 2 },
        ],
      },
    ],
    quickActions: [
      { id: "napkins", label: "Servilletas", icon: ScrollText, kind: "request_item", text: "servilletas" },
      { id: "bread", label: "Pan", icon: Croissant, kind: "request_item", text: "pan" },
      { id: "waiter", label: "Mesero", icon: ConciergeBell, kind: "call_waiter" },
      { id: "bill", label: "La cuenta", icon: CreditCard, kind: "bill" },
    ],
    tableDefaults: { labelPrefix: "Mesa", capacity: 2 },
  },
};

/** Helper seguro: cae a restaurante si el modo viniera vacío/desconocido. */
export function presetFor(mode: ModeKey | string | null | undefined): ModePreset {
  return MODE_PRESETS[(mode as ModeKey)] ?? MODE_PRESETS.restaurant;
}
