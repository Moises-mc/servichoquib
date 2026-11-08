# Servi Choquib — MVC + PostgreSQL

Aplicación web para publicar y contratar servicios locales. El frontend conserva su interfaz y consume una API Node.js/Express. El backend está organizado por MVC y utiliza PostgreSQL como almacenamiento persistente mediante `pg` (node-postgres).

## Requisitos

- Windows 10/11 (o macOS/Linux).
- Node.js 18.18 o superior y npm.
- PostgreSQL Server instalado y en ejecución.
- DBeaver es opcional: sirve para administrar y visualizar la base de datos, pero no reemplaza al servidor PostgreSQL.

## Configuración incluida

La configuración local del ZIP apunta a los datos que compartiste:

| Variable | Valor |
|---|---|
| DB_HOST | `localhost` |
| DB_PORT | `5432` |
| DB_NAME | `postgres` |
| DB_USER | `postgres` |
| DB_SCHEMA | `servi_choquib` |
| DB_PASSWORD | La contraseña configurada localmente en `server/.env` |

La aplicación usa la base `postgres` y crea un esquema independiente llamado `servi_choquib`. Así las tablas de Servi Choquib quedan separadas de las tablas del esquema `public` u otras aplicaciones. **No tienes que crear las tablas manualmente.**

> Seguridad: `server/.env` contiene la contraseña de PostgreSQL que proporcionaste. No compartas este ZIP ni publiques ese archivo. `server/.env` está excluido de Git. Si el ZIP se comparte con alguien más, cambia la contraseña del usuario PostgreSQL y actualiza `.env`.

## Puesta en marcha en Windows

1. Comprueba en `services.msc` que PostgreSQL esté en ejecución y que escuche en el puerto `5432`.
2. Descomprime el proyecto y abre PowerShell en la carpeta `server`.
3. Instala dependencias e inicia la API:

   ```powershell
   npm install
   npm run dev
   ```

   Si `server/.env` no existe, crea una copia de `.env.example` y completa `DB_PASSWORD` con tu contraseña de PostgreSQL.
4. En el navegador abre `http://localhost:8000/api/health`. Debe responder JSON con `ok: true` y `database: "connected"`.
5. Inicia Live Server desde la raíz del proyecto y abre el frontend en `http://127.0.0.1:5500` o `http://localhost:5500`.

El primer arranque verifica la conexión, crea el esquema y sus tablas, y carga los usuarios, servicios, reservas y mensajes de demostración. Las inserciones iniciales usan IDs estables y no duplican los datos cuando se reinicia la API.

## Comprobación de base de datos

Dentro de `server/`:

```powershell
npm run db:check
```

Para ejecutar las pruebas de API y persistencia, desde `server/`:

```powershell
npm test
npm run check
```

Las pruebas de integración usan `pg-mem`, un emulador PostgreSQL en memoria; no borran ni modifican tu base local real.

## Ver las tablas en DBeaver

1. Conecta DBeaver a `localhost:5432`, base de datos `postgres`, usuario `postgres`.
2. Expande `Schemas` y pulsa Refresh.
3. Abre el esquema `servi_choquib` y luego `Tables`.
4. Deben aparecer `users`, `services`, `bookings`, `messages`, `reviews` y `password_resets`.

También puedes ejecutar este SQL en DBeaver:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'servi_choquib'
ORDER BY table_name;
```

## Arquitectura

### Frontend

```text
js/
├── models/       # Estado y datos para la interfaz
├── services/     # Cliente HTTP y adaptador de demostración
├── controllers/  # Autenticación, navegación, chat, reservas y formularios
├── views/        # Renderizado por rol y componente
└── utils/        # Helpers compartidos
```

### Backend MVC

```text
server/src/
├── config/       # Variables de entorno
├── database/     # Pool PostgreSQL y migraciones SQL
├── models/       # Consultas y persistencia de entidades
├── controllers/  # Reglas de negocio y respuestas HTTP
├── routes/       # Endpoints y validación
├── middleware/   # JWT, CORS, seguridad, validación y errores
├── store/        # Carga de datos demo idempotente
├── utils/        # Hash de contraseñas y utilidades
├── app.js        # Ensamble de Express y Socket.IO
└── server.js     # Inicialización de DB, seed y servidor HTTP
```

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `ana@email.com` | `ana12345` |
| Cliente | `pedro@email.com` | `pedro12345` |
| Prestador | `carlos@email.com` | `carlos12345` |
| Prestador | `marco@email.com` | `marco12345` |
| Prestador | `sandra@email.com` | `sandra12345` |
| Administrador | `admin@servicios.co` | `admin12345` |

También se incluyen cuentas demo para Lucía, Jesús, Andrés, Fabio y Gloria, con contraseña formada por su nombre en minúsculas seguido de `12345`.

## Endpoints principales

- `GET /api/health`
- `POST /api/login`, `POST /api/register`
- `POST /api/password/forgot`, `POST /api/password/reset`
- `GET /api/me`, `GET/PUT /api/profile`
- `GET/POST /api/services`, `PUT/DELETE /api/services/:id`
- `GET/POST /api/bookings`, `PUT /api/bookings/:id`
- `GET /api/contacts`, `GET /api/users/:id`
- `GET/POST /api/messages`, `PUT/DELETE /api/messages/:id`, `DELETE /api/conversations/:contactId`
- `POST /api/reviews`, `POST /api/uploads`
- `GET /api-docs` y `GET /api-docs.json`

## Notas de producción

- Configura secretos propios, TLS y `CLIENT_ORIGIN` con el dominio real.
- Limita los permisos de la cuenta PostgreSQL de la aplicación; en producción es preferible no utilizar el superusuario `postgres`.
- La recuperación de contraseña solo genera códigos en consola para desarrollo; para producción hay que integrar un proveedor de correo.
- Los pagos permanecen en modo sandbox; no se procesa dinero real.
- Los archivos se guardan en `server/uploads`; para producción conviene almacenamiento de objetos y análisis de archivos.
