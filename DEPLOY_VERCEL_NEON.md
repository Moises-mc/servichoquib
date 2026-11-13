# Publicar Servi Choquib en Vercel y migrar PostgreSQL a Neon

## Arquitectura

- Vercel sirve el frontend desde `public/` por CDN y el backend Express como una Vercel Function exportada en `index.js`.
- La API queda en el mismo dominio: `https://TU-PROYECTO.vercel.app/api/...`. El frontend usa `/api` automáticamente en producción.
- Neon aloja PostgreSQL. La aplicación se conecta con `DATABASE_URL` pooled (`-pooler`).
- El esquema se conserva como `servi_choquib`.

## 0. Seguridad antes de empezar

Cambia la contraseña PostgreSQL que se había compartido en la conversación anterior. No uses credenciales antiguas en Neon ni las agregues a GitHub. Mantén `DATABASE_URL` solamente en las variables privadas de Vercel.

## 1. Exportar la base actual (Windows / PowerShell)

La aplicación usa la base de datos `postgres` y el esquema `servi_choquib`. Primero verifica el esquema en DBeaver:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'servi_choquib'
ORDER BY table_name;

SELECT COUNT(*) AS total_usuarios FROM servi_choquib.users;
```

En PowerShell, asegúrate de que `pg_dump` esté instalado (normalmente con PostgreSQL):

```powershell
pg_dump --version
```

Crea una copia de seguridad del esquema de la aplicación, sus tablas y datos:

```powershell
pg_dump -h localhost -p 5432 -U postgres -d postgres `
  --schema=servi_choquib --format=custom --no-owner --no-acl `
  --file=servi_choquib.dump
```

Introduce la contraseña cuando `pg_dump` la solicite. Si el servidor origen no es local, cambia `localhost` por el hostname/IP real de `dbserver`, y confirma que sea accesible desde tu PC. Guarda `servi_choquib.dump` fuera del repositorio; está excluido por `.gitignore`.

Si PowerShell no reconoce `pg_dump`, ejecuta el binario con la ruta de tu versión, por ejemplo:

```powershell
& "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe" -h localhost -p 5432 -U postgres -d postgres --schema=servi_choquib --format=custom --no-owner --no-acl --file=servi_choquib.dump
```

Ajusta `17` a tu versión instalada.

## 2. Crear Neon e importar

1. Crea un proyecto en <https://console.neon.tech/>. Elige una región cercana a la región donde ejecutarás la Function de Vercel.
2. Usa la base predeterminada del proyecto o crea una base dedicada (por ejemplo, `servi_choquib`). El esquema restaurado seguirá llamándose `servi_choquib`.
3. Pulsa **Connect** y copia la cadena **directa/unpooled** (desactiva el toggle de pooling). No la pegues en GitHub ni en el chat.
4. Restaura el dump en la base vacía de Neon. Sustituye el marcador por tu cadena directa completa:

```powershell
pg_restore --verbose --no-owner --no-privileges --exit-on-error `
  --dbname="TU_NEON_DIRECT_URL" .\\servi_choquib.dump
```

La URL directa suele tener un host sin `-pooler` y debe incluir `sslmode=require`. Para importar usa conexión directa, no la pooled. Neon documenta `pg_dump`/`pg_restore` con conexión no agrupada y `--no-owner`.

Si el proyecto Neon ya tiene tablas creadas por una ejecución previa de la API, no ejecutes una restauración a ciegas encima: crea una base/branch vacía o haz una copia y planifica una restauración limpia.

## 3. Verificar en Neon

Abre el SQL Editor de Neon y ejecuta:

```sql
SELECT current_database();
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'servi_choquib'
ORDER BY table_name;
SELECT COUNT(*) AS total_usuarios FROM servi_choquib.users;
SELECT COUNT(*) AS total_servicios FROM servi_choquib.services;
SELECT COUNT(*) AS total_reservas FROM servi_choquib.bookings;
```

Compara los conteos con la base original antes de cambiar la aplicación. Conserva el dump como respaldo.

## 4. Publicar en Vercel

1. Sube el proyecto al repositorio GitHub (sin `.env`, `node_modules`, dumps ni credenciales).
2. En Vercel, selecciona **Add New → Project** e importa el repositorio.
3. Configura **Root Directory** en la raíz del repositorio (`./`), no en `server/`.
4. Framework: Express (detectado por `vercel.json`). No definas Output Directory manualmente; Vercel sirve `public/**` por CDN.
5. Configura las variables de entorno siguientes para **Production** (y Preview si vas a probar previews).

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | `https://TU-PROYECTO.vercel.app` |
| `DATABASE_URL` | cadena **pooled** de Neon (`-pooler`) |
| `DB_SCHEMA` | `servi_choquib` |
| `DB_POOL_MAX` | `1` |
| `JWT_SECRET` | secreto aleatorio propio, mínimo 32 caracteres |

No configures `DB_HOST=localhost` ni `DB_PASSWORD` si usas `DATABASE_URL`. El `localhost` de Vercel no es tu PC.

Para crear un JWT secreto desde PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

En Neon, para la **aplicación en funciones serverless**, usa Connect con **Connection pooling activado**; el hostname contiene `-pooler`. Neon recomienda pooled para serverless y conexiones cortas. `DB_POOL_MAX=1` evita que cada instancia serverless abra demasiadas conexiones.

6. Despliega. Vercel instala las dependencias desde el `package.json` raíz y publica el frontend y Express bajo el mismo dominio.
7. Abre `https://TU-PROYECTO.vercel.app/api/health`. Debe devolver `ok: true` y `database: "connected"`.
8. Prueba registro, login, catálogo, reservas y mensajes; confirma que los nuevos registros aparecen en Neon.

Los cambios de variables de entorno solo aplican a los siguientes despliegues, así que vuelve a desplegar tras editarlas.

## 5. Detalles técnicos de esta adaptación

- `index.js` exporta Express como función Vercel e inicializa PostgreSQL de forma diferida una vez por instancia caliente.
- `public/` contiene una copia publicable del frontend. Edita el frontend en `public/` o sincroniza los cambios desde la raíz antes de hacer commit.
- `js/config.js` conserva `http://localhost:8000/api` en Live Server y usa `/api` en el dominio Vercel (mismo origen; no requiere URL API distinta).
- Se quitó `SET search_path`: Neon PgBouncer en modo transaccional no admite `SET` de sesión. Las consultas de los modelos ya usan el nombre de esquema explícito.
- La aplicación no ejecuta semillas de demostración al arrancar. Los datos demo solo existen como fixture aislado para pruebas automatizadas y nunca se insertan en Neon desde Vercel.
- En Vercel se desactivan Socket.IO y la ruta de disco local para archivos. El frontend actual usa la API REST para mensajes y no contiene un cliente Socket.IO. Vercel ofrece WebSockets en beta, pero las conexiones se cierran al alcanzar el tiempo máximo de la Function y las instancias no comparten memoria; para un chat realtime robusto se requiere reconexión y pub/sub compartido.
- Para archivos subidos por usuarios usa Vercel Blob (o S3/R2); el filesystem de una Function no es almacenamiento persistente y `express.static()` no sirve los assets estáticos en Vercel.
- La recuperación de contraseña aún necesita proveedor de correo en producción; los pagos continúan en sandbox.

## 6. Operación segura / corte

1. Mantén temporalmente la base anterior sin escrituras o pon la aplicación en mantenimiento durante el corte final.
2. Haz un dump final después de detener nuevas escrituras.
3. Restaura en Neon y compara conteos.
4. Actualiza `DATABASE_URL` en Vercel y despliega.
5. Verifica el endpoint health y los flujos críticos.
6. Conserva la base original y el dump como respaldo hasta confirmar la operación.

No abras el puerto 5432 de tu PC a Internet para que Vercel se conecte. Tras migrar, Vercel debe usar Neon.
