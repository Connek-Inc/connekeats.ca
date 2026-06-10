"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@heroui/react";

import { useAuth } from "@/lib/auth";

// Entrada del staff. El comensal entra directo por /t/[token] (deep link del QR).
export default function Index() {
  const { initialized, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    router.replace(session ? "/home" : "/login");
  }, [initialized, session, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <Spinner color="accent" size="lg" />
    </main>
  );
}
