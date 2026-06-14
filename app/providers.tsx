"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { ConsentBanner } from "@/components/ConsentBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AuthProvider } from "@/lib/auth";
import { LocaleProvider } from "@/lib/i18n";
import { ToastProvider } from "@/lib/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <LocaleProvider>
        <QueryClientProvider client={qc}>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ConsentBanner />
              <OfflineIndicator />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
