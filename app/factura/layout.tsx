"use client";
// La factura vive FUERA del grupo (staff), así que no hereda su <BusinessProvider>.
// La página lee el negocio activo con useBusiness() → necesita el provider aquí.
// (Sin esto, useBusiness() lanza en SSR y la ruta da 500.)
import { BusinessProvider } from "@/lib/business";

export default function FacturaLayout({ children }: { children: React.ReactNode }) {
  return <BusinessProvider>{children}</BusinessProvider>;
}
