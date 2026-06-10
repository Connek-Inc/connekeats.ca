"use client";
// Suscripción a cambios Postgres vía Supabase Realtime (staff), por business_id.
import { useEffect } from "react";

import { supabase } from "./supabase";

type Tbl =
  | "orders"
  | "order_item"
  | "service_request"
  | "tables"
  | "menu_item"
  | "menu_category"
  | "floor"
  | "staff_role"
  | "parking_ticket"
  | "delivery_order"
  | "buffet_station"
  | "customer"
  | "review"
  | "employee";

export function useRealtime(table: Tbl, businessId: number | null | undefined, onChange: () => void) {
  useEffect(() => {
    if (!supabase || !businessId) return;
    const channel = supabase
      .channel(`${table}_rt_${businessId}`)
      .on(
        "postgres_changes",
        table === "order_item"
          ? { event: "*", schema: "public", table }
          : { event: "*", schema: "public", table, filter: `business_id=eq.${businessId}` },
        () => onChange(),
      )
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, businessId]);
}
