"use client";
// Negocio activo del staff (persistido en localStorage).
import { createContext, useContext, useEffect, useState } from "react";

import { getActiveBusiness, setActiveBusiness } from "./hooks";

const Ctx = createContext<{ businessId: number | null; setBusinessId: (id: number | null) => void } | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businessId, setId] = useState<number | null>(null);
  useEffect(() => setId(getActiveBusiness()), []);
  const setBusinessId = (id: number | null) => {
    setId(id);
    setActiveBusiness(id);
  };
  return <Ctx.Provider value={{ businessId, setBusinessId }}>{children}</Ctx.Provider>;
}

export function useBusiness() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBusiness debe usarse dentro de <BusinessProvider>");
  return ctx;
}
