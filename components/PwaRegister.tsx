"use client";
// Registra el service worker (habilita instalar la PWA). Silencioso si el
// navegador no soporta SW o no está en contexto seguro (https/localhost).
import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
