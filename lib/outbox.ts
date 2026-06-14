"use client";
// Cola de envío offline (outbox). Si una ESCRITURA (POST/PATCH/DELETE) falla por
// falta de red, se guarda en localStorage y se reenvía automáticamente al volver
// la conexión. Cubre cortes BREVES de internet — no es offline-first completo
// (las LECTURAS siguen necesitando red; usan la caché de react-query mientras).

export type QueuedReq = {
  id: string;
  ts: number;
  method: string; // POST | PATCH | DELETE
  path: string;
  body?: unknown;
  token?: string | null; // token explícito (comensal); null = sesión staff actual
  label?: string; // descripción legible para el indicador
};

const KEY = "connek_outbox";
type Listener = (items: QueuedReq[]) => void;
const listeners = new Set<Listener>();

function read(): QueuedReq[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: QueuedReq[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage lleno / bloqueado → ignorar */
  }
  listeners.forEach((l) => l(items));
}

let counter = 0;
function genId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

export const outbox = {
  list: read,
  size: () => read().length,
  enqueue(req: Omit<QueuedReq, "id" | "ts">): QueuedReq {
    const item: QueuedReq = { ...req, id: genId(), ts: Date.now() };
    write([...read(), item]);
    return item;
  },
  remove(id: string) {
    write(read().filter((r) => r.id !== id));
  },
  clear() {
    write([]);
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    l(read());
    return () => listeners.delete(l);
  },
};

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

// La función real de reenvío la inyecta lib/api.ts (para evitar import circular).
let sender: ((req: QueuedReq) => Promise<void>) | null = null;
export function setOutboxSender(fn: (req: QueuedReq) => Promise<void>) {
  sender = fn;
}

let flushing = false;
export async function flushOutbox(): Promise<void> {
  if (flushing || !sender || !isOnline()) return;
  flushing = true;
  try {
    for (const item of read()) {
      try {
        await sender(item);
        outbox.remove(item.id); // enviado OK
      } catch (e) {
        // Si sigue sin red → parar y reintentar luego; si es error del servidor
        // (4xx/5xx) la operación es inválida → descartarla (no reintentar infinito).
        if (e instanceof TypeError || !isOnline()) break;
        outbox.remove(item.id);
      }
    }
  } finally {
    flushing = false;
  }
}

// Arranca los disparadores de reenvío (al reconectar, al volver el foco, y cada 20s).
let started = false;
export function startOutboxAutoFlush() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void flushOutbox());
  window.addEventListener("focus", () => void flushOutbox());
  setInterval(() => void flushOutbox(), 20000);
  void flushOutbox();
}
