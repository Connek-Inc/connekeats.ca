import type { NextConfig } from "next";

// El backend NO se expone aparte al navegador: la web reenvía /api/* al API
// por la red interna de Docker. Así el cliente (móvil incluido) solo usa el
// puerto de la web (3100), sin CORS ni un segundo puerto que abrir en el firewall.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://api:8000";

// Build de Tauri (app de escritorio/móvil): export ESTÁTICO embebido. Se activa
// con TAURI=1. El build normal (VPS) sigue siendo SSR con el proxy /api intacto.
const isTauri = process.env.TAURI === "1";

const nextConfig: NextConfig = isTauri
  ? {
      output: "export", // genera ./out estático para empaquetar dentro de Tauri
      images: { unoptimized: true }, // sin optimizador de imágenes server en export
      // cada ruta como carpeta/index.html → todo file-server (incluido el protocolo
      // del webview de Tauri) resuelve bien "/home" y "/home/" en cargas duras/refresh.
      trailingSlash: true,
      // expone el flag al cliente: la app nativa NO registra el service worker
      // (es innecesario y su intercepción de fetch rompe el protocolo de Tauri).
      env: { NEXT_PUBLIC_TAURI: "1" },
      // sin rewrites: en export el cliente llama al API por URL absoluta (NEXT_PUBLIC_API_URL)
    }
  : {
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${API_PROXY_TARGET}/:path*` }];
      },
    };

export default nextConfig;
