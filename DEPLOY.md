# Desplegar Connek Food en el VPS de Hostinger (connekeats.ca)

Frontend (`connekeats.ca`) + backend (`connekeatsbackend`) + Caddy (HTTPS) en un
solo VPS con Docker. El backend habla con tu **Supabase hosted** (la base no vive
en el VPS).

```
Navegador ──► https://connekeats.ca      (Caddy → web:3000)  Next.js
          ──► https://api.connekeats.ca  (Caddy → api:8000)  FastAPI ──► Supabase
```

---

## 1. DNS (en hPanel de Hostinger → Dominios → DNS de connekeats.ca)
No hay que “transferir” nada: solo apuntar a la **IP de tu VPS**.

| Tipo | Nombre | Valor |
|------|--------|-------|
| A    | `@`    | IP_DEL_VPS |
| A    | `www`  | IP_DEL_VPS |
| A    | `api`  | IP_DEL_VPS |

(Espera unos minutos a que propague. Verifica: `ping connekeats.ca` da la IP del VPS.)

---

## 2. Preparar el VPS (SSH)
```bash
ssh root@IP_DEL_VPS         # o el usuario que te dio Hostinger

# Docker + plugin compose (si no están)
curl -fsSL https://get.docker.com | sh
docker compose version      # debe imprimir una versión

# Carpeta del proyecto
mkdir -p /opt/connek && cd /opt/connek

# Clonar los dos repos (como hermanos)
git clone https://github.com/Connek-Inc/connekeats.ca.git
git clone https://github.com/Connek-Inc/connekeatsbackend.git

# Copiar los archivos de despliegue al nivel /opt/connek
cp connekeats.ca/deploy/docker-compose.yml .
cp connekeats.ca/deploy/Caddyfile .
```

---

## 3. Crear los `.env` (con TUS secretos — NO están en git)

**Backend** → `/opt/connek/connekeatsbackend/.env`:
```env
SUPABASE_URL=https://ttqnmfueocnjkmsqrkjk.supabase.co
SUPABASE_KEY=<service-role-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret de Supabase: Settings → API → JWT Secret>
DINER_TOKEN_SECRET=<secreto largo: openssl rand -base64 32>
DINER_TOKEN_TTL_MIN=180
DINER_WEB_BASE=https://connekeats.ca
DB_THREADPOOL_SIZE=100
CORS_ALLOW_ALL=false
CORS_ORIGINS=https://connekeats.ca,https://www.connekeats.ca
TRUSTED_HOSTS=*
DOCS_PUBLIC=false
```

**Frontend** → `/opt/connek/connekeats.ca/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.connekeats.ca
NEXT_PUBLIC_SUPABASE_URL=https://ttqnmfueocnjkmsqrkjk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
```
> ⚠️ Las `NEXT_PUBLIC_*` se hornean en el build. Si cambias una, reconstruye con `--build`.

---

## 4. Levantar
```bash
cd /opt/connek
docker compose up -d --build      # construye api + web, baja Caddy, saca HTTPS solo
docker compose ps                 # los 3 (api, web, caddy) en "Up"
docker compose logs -f caddy      # ver cómo obtiene el certificado
```

---

## 5. Configurar Supabase para el dominio nuevo
Dashboard de Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://connekeats.ca`
- **Redirect URLs** (añade): `https://connekeats.ca/**`, `https://connekeats.ca/reset`

Y aplica las **migraciones pendientes** (SQL Editor) si aún no: el bloque `005→014`
que ya tienes (incluye RH/manager `013` y tiempo real `014`).

---

## 6. Verificar
- `https://api.connekeats.ca/health` → `{"status":"ok", ...}`
- `https://connekeats.ca` → carga la app, login funciona.
- Escanear un QR `https://connekeats.ca/t/<token>` → menú del comensal.
- En el teléfono: **“Instalar app”** ya aparece (¡ahora sí, por el HTTPS!).

---

## Actualizar después de un cambio
```bash
cd /opt/connek/connekeats.ca && git pull          # o connekeatsbackend
cd /opt/connek && docker compose up -d --build web # o api
```

## Notas
- **Firewall:** abre puertos **80** y **443** en el VPS (Hostinger → firewall) si no lo están.
- El backend NO copia el `.env` a la imagen (entra por `env_file`), así que el secreto
  vive solo en el VPS, nunca en git.
- ¿`api.connekeats.ca` no saca cert? Revisa que el DNS de `api` apunte al VPS y que 80/443 estén abiertos.
