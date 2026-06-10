"use client";
// Alta de negocio = wizard divertido (concepto → carta → mesas → ¡listo!).
// Vive dentro de (staff), así que hereda el guard de auth del layout.
// Guard extra: si el setup YA está hecho (tienes negocio) y no vienes a crear
// otro (?new=1), te manda al dashboard en vez de dejarte atrapado en el wizard.

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Wizard } from "@/components/onboarding/Wizard";
import { useBusinesses } from "@/lib/hooks";

export default function OnboardingPage() {
  const businesses = useBusinesses();
  const router = useRouter();
  const decided = useRef(false);

  useEffect(() => {
    // Decidir UNA sola vez, con la query ya asentada (snapshot al entrar): así no
    // rebota después de crear el negocio aquí (deja ver el paso "¡Listo!").
    if (decided.current || !businesses.isSuccess) return;
    decided.current = true;
    const wantNew =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("new") === "1";
    if (!wantNew && (businesses.data?.length ?? 0) > 0) {
      router.replace("/home");
    }
  }, [businesses.isSuccess, businesses.data, router]);

  return <Wizard />;
}
