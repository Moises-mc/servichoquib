# Servi Choquib — corrección de despliegue Vercel

## Qué se corrigió en esta versión

1. Se eliminó la configuración personalizada de empaquetado de `functions` que interfería con la detección automática de Express. Vercel ahora utiliza su integración Express de configuración cero.
2. Se dejó `index.js` como entrada serverless: exporta la aplicación Express y no ejecuta `listen()` en Vercel.
3. Se alineó Node.js en `package.json` y `package-lock.json` a Node 24.x.
4. Se alinearon las dependencias y lockfiles de la raíz y de `server/`, incluyendo `pg` y Multer 2.
5. Se agregó `.vercelignore` para evitar enviar dependencias instaladas localmente, `.env`, repositorio Git y respaldos.
6. Se corrigió `public/js/config.js`: GitHub Pages ahora consulta `https://servichoquib.vercel.app/api`; en local usa `http://localhost:8000/api`.
7. Se corrigió el mapeo del campo `DATE` en reservas para no usar un cast SQL `date::text` que fallaba en las pruebas con pg-mem.

## Antes de subir

- En Vercel, **Root Directory** debe ser `./` (raíz del repositorio), no `server/`.
- Framework Preset: Express (o detección automática).
- No configures un Output Directory.
- Asegúrate de que Vercel instale desde el `package.json` de la raíz.

Si `node_modules` estuvo agregado anteriormente a Git, `.gitignore` no lo elimina del índice. Ejecuta desde PowerShell en la raíz del repositorio:

```powershell
git rm -r --cached node_modules server/node_modules
git add .
git commit -m "Fix Vercel Express deployment and dependencies"
git push
```

Si `git rm` indica que alguna ruta no está en el índice, puedes ignorar ese mensaje para esa ruta. No borres las carpetas locales si necesitas usarlas; el comando `--cached` solo las retira del repositorio.

## Variables de entorno de Vercel

Configura en **Settings → Environment Variables** para Production:

| Variable | Valor / requisito |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL pooled de Neon, con SSL habilitado |
| `DB_SCHEMA` | `servi_choquib` |
| `DB_POOL_MAX` | `1` |
| `CLIENT_ORIGIN` | `https://moises-mc.github.io` |
| `JWT_SECRET` | Secreto aleatorio propio de al menos 32 caracteres |
| `SEED_DEMO_DATA` | `false` |

No pegues `DATABASE_URL` ni `JWT_SECRET` en GitHub, archivos del frontend, ni conversaciones. No agregues `DB_PASSWORD` cuando usas `DATABASE_URL`. Rota cualquier credencial que haya sido expuesta previamente.

## Comprobaciones locales (PowerShell)

Desde la raíz del proyecto:

```powershell
npm ci
npm run check
npm test
npm run vercel:check
```

Desde `server/` también puedes ejecutar `npm ci`, `npm run check` y `npm test`; los dos lockfiles están sincronizados para permitir ambos flujos. Para probar el backend local, crea `server/.env` a partir de `server/.env.example`, completa la conexión PostgreSQL y ejecuta `npm run dev`.

## Después del despliegue

Prueba estas URLs:

- `https://servichoquib.vercel.app/`
- `https://servichoquib.vercel.app/api/health`

La segunda debe responder HTTP 200 y un JSON con `ok: true` y `database: "connected"`. Si desaparece `Cannot find module './router'` pero `/api/health` sigue devolviendo 500, consulta el nuevo Runtime Log: el siguiente error probablemente será de variables de entorno, conexión SSL o migración de Neon, y debe diagnosticarse con ese registro nuevo.

## Alcance de la verificación

La causa exacta de `Cannot find module './router'` ocurre dentro del paquete Express empaquetado por Vercel. No es posible reproducir el empaquetado remoto ni verificar la configuración privada del proyecto desde el ZIP. Esta corrección elimina el override de empaquetado, alinea manifiestos/lockfiles y excluye `node_modules` locales para forzar una instalación limpia en Vercel; el resultado definitivo se confirma con un nuevo despliegue.
