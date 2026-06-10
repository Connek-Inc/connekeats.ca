"use client";

import { Spinner } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { BusinessProvider } from "@/lib/business";

function Guard({ children }: { children: React.ReactNode }) {
  const { initialized, session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = pathname === "/login";
  // Login y el wizard de onboarding van a pantalla completa (sin shell de nav).
  const noShell = onLogin || pathname === "/onboarding";

  useEffect(() => {
    if (!initialized) return;
    if (!session && !onLogin) router.replace("/login");
    else if (session && onLogin) router.replace("/home");
  }, [initialized, session, onLogin, router]);

  if (!initialized) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Spinner color="accent" size="lg" />
      </main>
    );
  }
  if (!session || noShell) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <Guard>{children}</Guard>
    </BusinessProvider>
  );
}
