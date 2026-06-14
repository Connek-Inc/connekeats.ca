"use client";
// Indicador de conexión + cola de envío. Muestra "Sin conexión · N en cola"
// cuando no hay red, y "Enviando N…" mientras reenvía al reconectar. Arranca el
// auto-flush de la cola (al reconectar / volver el foco / cada 20s).

import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { flushOutbox, isOnline, outbox, startOutboxAutoFlush } from "@/lib/outbox";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    startOutboxAutoFlush();
    setOnline(isOnline());
    const on = () => {
      setOnline(true);
      void flushOutbox();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const unsub = outbox.subscribe((items) => setPending(items.length));
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      unsub();
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      className={`safe-pb fixed inset-x-0 bottom-3 z-[60] mx-auto flex w-fit max-w-[92%] items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur ${
        online ? "bg-foreground text-background" : "bg-amber-500 text-black"
      }`}
    >
      {online ? (
        <>
          <RefreshCw className="size-3.5 animate-spin" /> Enviando {pending} cambio{pending === 1 ? "" : "s"}…
        </>
      ) : (
        <>
          <CloudOff className="size-3.5" /> Sin conexión
          {pending > 0 ? ` · ${pending} en cola (se enviará al reconectar)` : ""}
        </>
      )}
    </div>
  );
}
