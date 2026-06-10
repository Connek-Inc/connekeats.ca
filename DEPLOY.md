# Desplegar Connek Food en el VPS de Hostinger (connekeats.ca)

Frontend + backend + Caddy (HTTPS) en un solo VPS con Docker. El backend habla con
tu **Supabase hosted** (la base no vive en el VPS) y **no se expone a internet**:
la web reenvía `/api/*` al backend por la red interna de Docker.

```
Navegador ──► https://connekeats.ca            (Caddy → web:3000)  Next.js
                         └─ /api/* ─► api:8000  (interno)          FastAPI ──► Supabase
```

---

## 1. DNS (hPanel → Dominios → DNS de connekeats.ca)
No hay que “transferir” nada: solo apuntar a la **IP del VPS**.

| Tipo | Nombre | Valor |
|------|--------|-------|
| A    | `@`    | IP_DEL_VPS |
| A    | `www`  | IP_DEL_VPS |

(Verifica luego: `ping connekeats.ca` debe dar la IP del VPS.)

---

## 2. Preparar el VPS (SSH / Browser terminal del hPanel)
```bash
# Docker + compose (si no están)
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

# Carpeta + repos (como hermanos)
mkdir -p /opt/connek && cd /opt/connek
git clone https://github.com/Connek-Inc/connekeats.ca.git
git clone https://github.com/Connek-Inc/connekeatsbackend.git

# Archivos de despliegue al nivel /opt/connek
cp connekeats.ca/deploy/docker-compose.yml .
cp connekeats.ca/deploy/Caddyfile .
```

---

## 3. Crear los `.env` (con TUS secretos — NO están en git)

**Frontend** → `/opt/connek/connekeats.ca/.env.local` (solo valores PÚBLICOS):
```env
NEXT_PUBLIC_SUPABASE_URL=https://ttqnmfueocnjkmsqrkjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```
> No se pone `NEXT_PUBLIC_API_URL`: por defecto usa `/api` (mismo origen). Si cambias una, reconstruye con `--build`.

**Backend** → `/opt/connek/connekeatsbackend/.env`:
```env
SUPABASE_URL=https://ttqnmfueocnjkmsqrkjk.supabase.co
SUPABASE_KEY=<service-role-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret: Supabase → Settings → API → JWT Secret>
DINER_TOKEN_SECRET=<secreto largo: openssl rand -base64 32>
DINER_TOKEN_TTL_MIN=180
DINER_WEB_BASE=https://connekeats.ca
DB_THREADPOOL_SIZE=100
CORS_ALLOW_ALL=true
TRUSTED_HOSTS=*
DOCS_PUBLIC=false
```

---

## 4. Levantar
```bash
cd /opt/connek
docker compose up -d --build      # api + web + Caddy (saca HTTPS solo)
docker compose ps                 # los 3 en "Up"
docker compose logs -f caddy      # ver cómo obtiene el certificado
```

---

## 5. Supabase para el dominio nuevo
Dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://connekeats.ca`
- **Redirect URLs:** `https://connekeats.ca/**`, `https://connekeats.ca/reset`

Y aplica las **migraciones** `005→014` (SQL Editor) si aún no.

---

## 6. Verificar
- `https://connekeats.ca/api/health` → `{"status":"ok", ...}` (el proxy interno funciona).
- `https://connekeats.ca` → carga, login funciona.
- `https://connekeats.ca/t/<token>` → menú del comensal (QR).
- En el teléfono: **“Instalar app”** (¡ahora sí, por el HTTPS!).

---

## Actualizar después de un cambio
```bash
cd /opt/connek/connekeats.ca && git pull          # o connekeatsbackend
cd /opt/connek && docker compose up -d --build web # o api
```

## Notas
- **Firewall:** abre puertos **80** y **443** en el VPS.
- El backend va `expose` (interno), nunca publicado al host → no es accesible desde fuera, solo la web lo alcanza por la red de Docker.
- Los `.env` viven solo en el VPS, nunca en git.
