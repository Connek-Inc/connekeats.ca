"use client";
// Notificaciones EFECTIVAS: toast en pantalla + sonido (beep Web Audio) +
// notificación del sistema operativo cuando la pestaña está en segundo plano.
// Sin assets ni servidor de push: usa la Notification API del navegador (la app
// ya está abierta con realtime/polling, así que no hace falta push server).

import { useToast } from "./toast";

let audioCtx: AudioContext | null = null;

/** Pitido corto (sin archivo de audio). */
export function beep() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    const t = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.start(t);
    o.stop(t + 0.42);
  } catch {
    /* ignore */
  }
}

/** Pide permiso de notificaciones del SO (llamar tras un gesto del usuario). */
export function ensureNotifyPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "default") void Notification.requestPermission();
  } catch {
    /* ignore */
  }
}

/** Notificación del SO, solo si la pestaña NO está visible (evita duplicar el toast). */
export function browserNotify(title: string, body?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "granted" && document.visibilityState !== "visible") {
      new Notification(title, { body, icon: "/icon.svg", tag: title } as NotificationOptions);
    }
  } catch {
    /* ignore */
  }
}

/** Hook: dispara toast (visible) + sonido + notificación del SO (en 2º plano). */
export function useNotifier() {
  const { show } = useToast();
  return (msg: string, opts?: { body?: string; sound?: boolean }) => {
    show(msg, "success");
    if (opts?.sound !== false) beep();
    browserNotify(msg, opts?.body);
  };
}
