// Cliente HTTP contra connek-restaurantes-api (el que ya está en Vercel).
import { API_URL } from "./config";
import { supabase } from "./supabase";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Opts = { method?: string; body?: unknown; token?: string | null };

async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Token explícito (sesión de mesa del comensal) gana; si no, JWT del staff.
  let token = opts.token ?? null;
  if (!token && supabase) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (data && typeof data === "object" && "detail" in data) {
      msg = String((data as { detail: unknown }).detail);
    }
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

// Subida multipart (archivos). NO fija Content-Type: el navegador pone el
// boundary correcto. Reusa el JWT del staff como el resto de llamadas.
async function upload<T>(path: string, form: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: form, cache: "no-store" });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (data && typeof data === "object" && "detail" in data) msg = String((data as { detail: unknown }).detail);
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body, token }),
  del: <T>(path: string, token?: string | null) => request<T>(path, { method: "DELETE", token }),
  upload,
};
