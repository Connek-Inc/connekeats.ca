import type { NextConfig } from "next";

// El backend NO se expone aparte al navegador: la web reenvía /api/* al API
// por la red interna de Docker. Así el cliente (móvil incluido) solo usa el
// puerto de la web (3100), sin CORS ni un segundo puerto que abrir en el firewall.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://api:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_PROXY_TARGET}/:path*` }];
  },
};

export default nextConfig;
