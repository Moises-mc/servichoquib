# Servi Choquib — correcciones de despliegue Vercel + Neon

## Correcciones aplicadas

1. Se alineó el `package.json` raíz con las dependencias que realmente importa el backend (`express`, `pg`, `multer`, `jsonwebtoken`, `socket.io`, etc.).
2. Se configuró el proyecto raíz como ES Modules (`type: module`), porque `index.js` y el backend utilizan `import`/`export`.
3. Se alineó Node.js a `24.x` en los manifiestos de instalación.
4. Se corrigió el pool PostgreSQL para conectarse mediante `DATABASE_URL` cuando está configurada. En ese modo utiliza TLS para Neon y respeta `DB_POOL_MAX`.
5. Se corrigió el punto de entrada serverless: Vercel exporta la aplicación Express, inicializa la base de datos de forma diferida y no ejecuta `listen()`.
6. Se implementaron las opciones que el punto de entrada ya enviaba a `createApp`: Socket.IO y almacenamiento local de archivos se desactivan en Vercel.
7. Se agregó inicialización de base de datos antes de atender rutas API en cada instancia serverless (con una promesa reutilizada por instancia caliente).
8. Se eliminó `SET search_path` como configuración de sesión, porque una sesión de un pool no garantiza que la siguiente consulta use la misma conexión. Los modelos trabajan con nombres de esquema explícitos.
9. Se corrigió la URL de API del frontend: en Vercel usa `/api` del mismo dominio; en GitHub Pages apunta a la API publicada en Vercel; en local apunta a `localhost:8000`.
10. Se agregó un script de pruebas que establece `NODE_ENV=test`, para que los tests no exijan credenciales reales de PostgreSQL.
11. Se restauró `.env.example` y se mantuvieron fuera del paquete de entrega los secretos y archivos `.env`.

## Verificaciones locales ejecutadas

Desde la raíz:

```bash
npm test
npm run check
npm run vercel:check
npm ci --dry-run --ignore-scripts --offline
```

Los 12 tests automatizados pasan; la comprobación de sintaxis revisa 52 archivos JavaScript y el preflight confirma los archivos esenciales de Vercel.

## Configuración necesaria en Vercel

- **Root Directory:** `./` (raíz del repositorio).
- **Framework Preset:** Express o detección automática.
- No configures un Output Directory manual.
- Usa Node.js `24.x`.
- Configura estas variables para Production (y Preview si corresponde):

| Variable | Valor / requisito |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL pooled de Neon, con SSL habilitado |
| `DB_SCHEMA` | `servi_choquib` |
| `DB_POOL_MAX` | `1` |
| `CLIENT_ORIGIN` | `https://moises-mc.github.io` si el frontend se sirve desde GitHub Pages; si todo está en Vercel, agrega los orígenes externos que realmente uses |
| `JWT_SECRET` | secreto aleatorio propio de al menos 32 caracteres |

No configures `DB_HOST=localhost` ni `DB_PASSWORD` en Vercel cuando uses `DATABASE_URL`. La cadena de Neon y el JWT deben guardarse únicamente en Environment Variables de Vercel.

## Antes de subir los cambios a GitHub

El ZIP original contenía `.git` y `node_modules`; no los incluyas en futuras entregas. Además, el repositorio Git actual tiene archivos de `node_modules` en su índice. Desde PowerShell, en la raíz del repositorio, ejecuta:

```powershell
git rm -r --cached node_modules server/node_modules
git add .
git commit -m "Fix Vercel deployment and Neon PostgreSQL connection"
git push
```

Si una de las carpetas no está en el índice, Git puede indicar que no la conoce; continúa con la otra. `--cached` no borra las dependencias de tu computador.

El archivo `server/.env` se excluye del índice Git, pero estaba dentro del ZIP compartido. Si contiene credenciales reales o reutilizadas en producción, cámbialas. Nunca subas `.env` a GitHub.

## Prueba después del despliegue

Abre:

- `https://TU-PROYECTO.vercel.app/`
- `https://TU-PROYECTO.vercel.app/api/health`

La segunda dirección debe responder HTTP 200 con `ok: true` y `database: "connected"`.

Después prueba registro, inicio de sesión, catálogo, reservas, mensajes y persistencia en Neon.

## Funcionalidades que requieren una configuración externa adicional

- Las cargas de archivos locales están desactivadas en Vercel porque el disco de una Function no es almacenamiento persistente. Para habilitarlas en producción hay que integrar Vercel Blob, S3 o R2.
- Socket.IO queda desactivado en el despliegue serverless actual; la mensajería REST permanece disponible. Para chat en tiempo real se necesita un servicio compatible y una estrategia de reconexión/pub-sub.
- La recuperación de contraseña necesita un proveedor de correo configurado.
- Los pagos continúan en modo sandbox.

La conexión real con Neon y el resultado del despliegue remoto no pueden certificarse desde el ZIP: requieren las variables privadas del proyecto y una ejecución en Vercel.
