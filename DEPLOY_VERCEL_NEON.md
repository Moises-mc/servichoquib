# Publicar Servi Choquib en Vercel y migrar PostgreSQL a Neon

## Arquitectura

- **Frontend**: Vercel sirve el frontend desde `public/` directamente por CDN.
- **Backend API**: Express se ejecuta como Vercel Serverless Function exportada en `index.js`.
- **Rutas API**: La API queda bajo el mismo dominio: `https://servichoquib.vercel.app/api/...`.
- **GitHub Pages**: Si se usa `https://moises-mc.github.io`, se conecta a `https://servichoquib.vercel.app/api`.
- **Base de Datos**: Neon aloja PostgreSQL serverless (`DATABASE_URL` pooled `-pooler`).

---

## 1. Variables de Entorno Requeridas en Vercel

En el panel de Vercel (**Project Settings → Environment Variables**), agrega las siguientes variables para el entorno **Production** (y Preview):

| Variable | Valor Recomendado | Descripción |
|---|---|---|
| `NODE_ENV` | `production` | Modo producción |
| `CLIENT_ORIGIN` | `https://servichoquib.vercel.app,https://moises-mc.github.io` | Orígenes web permitidos por CORS |
| `DATABASE_URL` | `postgresql://usuario:clave@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require` | Cadena **pooled** de Neon |
| `DB_SCHEMA` | `servi_choquib` | Esquema de tablas |
| `DB_POOL_MAX` | `1` | 1 conexión por instancia serverless |
| `JWT_SECRET` | *(cadena aleatoria de más de 32 caracteres)* | Firma de tokens de sesión |
| `SEED_DEMO_DATA` | `false` | Evita reinsertar datos demo en producción |

> **Nota sobre `DATABASE_URL`**: En Neon, pulsa el botón **Connect**, asegúrate de que el toggle de **Connection Pooling** esté **activado** (el host debe contener `-pooler`), y copia la URL completa con `?sslmode=require`.

> **Generar JWT_SECRET**:
> ```powershell
> node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
> ```

---

## 2. Configuración en Vercel Dashboard

1. **Root Directory**: Deja `./` (la raíz del repositorio).
2. **Framework Preset**: Selecciona **Other** (el enrutamiento está configurado mediante `vercel.json` con `rewrites`).
3. **Build Command**: Déjalo vacío o por defecto.
4. **Output Directory**: Déjalo vacío o por defecto.

---

## 3. Verificar el Despliegue

Una vez desplegado:
1. Abre `https://servichoquib.vercel.app/`: debe cargar el frontend inmediatamente.
2. Abre `https://servichoquib.vercel.app/api/health`:
   - Si la base de datos está conectada: responderá `{"ok":true,"database":"connected","service":"Servi Choquib API"}`.
   - Si falta `DATABASE_URL`: responderá `503` con mensaje descriptivo indicando configurar la variable.
3. Inicia sesión desde el frontend de Vercel o desde GitHub Pages.
