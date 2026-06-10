# Frontend Next.js — imagen de PRODUCCIÓN local (next build + next start).
# Producción NO usa eval() → evita el error de CSP/eval del modo dev, y es más
# rápida. Las NEXT_PUBLIC_* se hornean en build desde .env.local (son públicas:
# api url + url de supabase + publishable key). Si cambias una llave → rebuild.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
