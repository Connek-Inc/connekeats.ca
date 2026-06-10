// Config central (web). Default al backend YA desplegado en Vercel, así que
// funciona sin .env. El comensal no necesita Supabase; el staff sí (login).

// API base: por defecto "/api" (MISMO origen que la web). Next reenvía /api/*
// al backend (ver next.config.ts rewrites). Así el navegador solo usa el puerto
// de la web → funciona en localhost y en la red local con UN puerto y sin CORS.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
