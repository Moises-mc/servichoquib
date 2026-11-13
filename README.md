# Servi Choquib — MVC + PostgreSQL + Vercel/Neon

Proyecto de marketplace de servicios con frontend HTML/CSS/JavaScript y API Node.js/Express organizada en MVC, con PostgreSQL mediante `pg`.

## Publicación recomendada

Consulta [`CORRECCION_VERCEL.md`](CORRECCION_VERCEL.md) para el diagnóstico y redepliegue; y [`DEPLOY_VERCEL_NEON.md`](DEPLOY_VERCEL_NEON.md) para exportar el esquema `servi_choquib` desde el PostgreSQL actual, importarlo a Neon y desplegar frontend + API REST en Vercel desde un solo repositorio.

- Vercel sirve `public/` como frontend y `index.js` como Express Function.
- La API usa el mismo dominio bajo `/api`.
- Neon se conecta mediante `DATABASE_URL` pooled y `DB_SCHEMA=servi_choquib`.
- No subas archivos `.env`, dumps SQL ni contraseñas al repositorio. Rota las credenciales que se hayan compartido anteriormente.

## Desarrollo local

Requisitos: Node.js 24 LTS y PostgreSQL. Desde `server/`, crea `.env` a partir de `.env.example`, completa la conexión PostgreSQL, y ejecuta:

```powershell
npm install
npm run db:check
npm run dev
```

Abre `http://localhost:8000/api/health`; para el frontend usa Live Server sobre el `index.html` de la raíz. El backend local sigue cargando datos demo por defecto.

La raíz incluye también `package.json` para que Vercel instale las dependencias al desplegar. `public/` es la copia del frontend que sirve Vercel; si modificas `index.html`, `js/` o `style.css` en la raíz, sincroniza esos archivos a `public/` antes de subir cambios.

## Comprobaciones

Desde `server/`: `npm test`, `npm run check` y `npm run db:check`. Desde la raíz Vercel: `npm test` / `npm run check` (tras `npm install`).

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


## Seguridad de cuentas y notificaciones

- El registro crea una cuenta pendiente y solo la activa después de validar el código enviado por correo.
- Los códigos vencen a los 10 minutos y permiten máximo 5 intentos.
- La recuperación se solicita usando el correo de la cuenta y permite escoger correo o SMS. El SMS exige un teléfono verificado desde el perfil.
- Configura `RESEND_API_KEY` y `RESEND_FROM_EMAIL` para correo; configura `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM_NUMBER` para SMS. No guardes estas credenciales en el repositorio.
- Las cuentas y datos demo ya no se generan. La migración `002_auth_security.sql` elimina únicamente los IDs y correos demo conocidos.
- PayU no está integrado en esta versión. Completar un servicio no registra un pago; los ingresos solo se calculan cuando existe una confirmación de pago real.

## Historial de cambios

Las modificaciones y mejoras del proyecto están reunidas en un solo documento: [`CAMBIOS_SERVICHOQUIB.md`](CAMBIOS_SERVICHOQUIB.md). Las guías de despliegue y arquitectura se conservan por separado para no mezclar instrucciones operativas con el historial de cambios.
