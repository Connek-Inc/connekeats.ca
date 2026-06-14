import type { MetadataRoute } from "next";

// `force-static` para que sea compatible con el export estático de Tauri
// (es contenido fijo; en SSR no cambia nada).
export const dynamic = "force-static";

// PWA manifest (Next lo sirve en /manifest.webmanifest y lo enlaza solo).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Connek Food",
    short_name: "Connek",
    description: "Pedidos por QR, salón, cocina, caja y gestión — en tiempo real.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
