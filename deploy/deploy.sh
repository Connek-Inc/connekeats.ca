#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
# Connek Food — despliegue completo en el VPS (frontend + backend + Caddy).
# Uso en el VPS (como root):
#   mkdir -p /opt/connek && cd /opt/connek
#   git clone https://github.com/Connek-Inc/connekeats.ca.git
#   bash connekeats.ca/deploy/deploy.sh
# Te pedirá pegar el .env del backend (con tus secretos) una sola vez.
# ════════════════════════════════════════════════════════════════════
set -e

ROOT=/opt/connek
mkdir -p "$ROOT" && cd "$ROOT"

# 1) Docker (si falta)
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

# 2) Repos (clona el que falte; actualiza los existentes)
[ -d connekeats.ca ]     || git clone https://github.com/Connek-Inc/connekeats.ca.git
[ -d connekeatsbackend ] || git clone https://github.com/Connek-Inc/connekeatsbackend.git
( cd connekeats.ca && git pull -q ) || true
( cd connekeatsbackend && git pull -q ) || true

# 3) Orquestación (compose + Caddy) al nivel /opt/connek
cp connekeats.ca/deploy/docker-compose.yml .
cp connekeats.ca/deploy/Caddyfile .

# 4) Frontend .env (valores PÚBLICOS — seguro versionarlos)
printf 'NEXT_PUBLIC_SUPABASE_URL=https://ttqnmfueocnjkmsqrkjk.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_jtDZ8ylJp2LkXiOcvofE_w_qrYlRxwh\n' > connekeats.ca/.env.local

# 5) Backend .env (con TUS secretos). Solo pide pegarlo si aún no está completo.
if [ ! -s connekeatsbackend/.env ] || grep -q 'PEGA_' connekeatsbackend/.env 2>/dev/null; then
  echo
  echo ">>>>>>>>>> PEGA AHORA el contenido de tu .env.production y luego pulsa Ctrl+D <<<<<<<<<<"
  echo
  cat > connekeatsbackend/.env
fi

# 6) Construir y levantar
echo ">>> Construyendo y levantando (tarda unos minutos)…"
docker compose up -d --build
echo
docker compose ps
echo
echo ">>> Listo. Prueba: https://connekeats.ca/api/health  (cuando el DNS apunte al VPS)"
