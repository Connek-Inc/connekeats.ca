"use client";
// Registra el service worker (habilita instalar la PWA). Silencioso si el
// navegador no soporta SW o no está en contexto seguro (https/localhost).
//
// EXCEPCIÓN: dentro de la app nativa (Tauri) NO se registra. Ahí el SW es
// innecesario (el frontend ya va embebido y local) y su intercepción del evento
// `fetch` sobre el protocolo del webview (tauri://) cuelga la carga. Se detecta
// por el flag de build (NEXT_PUBLIC_TAURI) y, por robustez, en runtime.
import { useEffect } from "react";

function isTauriRuntime(): boolean {
  if (process.env.NEXT_PUBLIC_TAURI === "1") return true; // build empaquetado
  if (typeof window === "undefined") return false;
  return (
    "__TAURI_INTERNALS__" in window ||
    "__TAURI__" in window ||
    window.location.protocol === "tauri:" ||
    window.location.hostname === "tauri.localhost"
  );
}

export function PwaRegister() {
  useEffect(() => {
    if (isTauriRuntime()) return; // app nativa: sin service worker
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
