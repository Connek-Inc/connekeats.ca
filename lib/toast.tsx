"use client";
// Toast minimalista (dark/glass) montado en el root. La capa más alta.
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "info" | "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastCtx = createContext<{ show: (m: string, t?: Tone) => void } | null>(null);

const TONE: Record<Tone, string> = {
  info: "bg-foreground/15 border-foreground/20 text-foreground",
  success: "bg-foreground border-foreground text-background",
  error: "bg-background border-foreground/50 text-foreground",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border px-5 py-3 text-center font-medium shadow-xl backdrop-blur-md animate-[toastIn_.2s_ease] ${TONE[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
