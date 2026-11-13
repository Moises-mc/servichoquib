# Despliegue de Servi Choquib API

El frontend `https://moises-mc.github.io` y el backend son servicios distintos. GitHub Pages no ejecuta Node ni PostgreSQL.

## Servicio Node.js

En el hosting configura como raíz del proyecto `server/`, instala con `npm install` y ejecuta `npm start`. Usa Node.js 18.18 o superior. El proceso escucha en `0.0.0.0` usando `PORT` del entorno.

Variables requeridas/recomendadas:

```env
NODE_ENV=production
CLIENT_ORIGIN=https://moises-mc.github.io
JWT_SECRET=un-secreto-aleatorio-de-al-menos-32-caracteres
DB_SCHEMA=servi_choquib
DB_POOL_MAX=10
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

Para PostgreSQL elige una sola opción:

- `DATABASE_URL` con la cadena del servicio de base de datos; o
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

En una base administrada que requiera TLS configura `DB_SSL=true`. `DATABASE_URL` y las contraseñas deben guardarse en el gestor de secretos del hosting, no en GitHub ni en `js/config.js`.

**No uses `DB_HOST=localhost` en el hosting** salvo que PostgreSQL corra dentro del mismo contenedor/servidor. El `localhost` del hosting no es el PC del desarrollador. No expongas tu puerto PostgreSQL 5432 directamente a Internet.

## Validar el servicio

Abre `https://TU-DOMINIO-API/api/health`. La API debe devolver `ok: true` y `database: "connected"`.

En producción configura `CLIENT_ORIGIN` con el origen exacto `https://moises-mc.github.io` (sin `/` final y sin ruta). Si usas otro dominio, actualiza el origen.

## Conectar GitHub Pages

En la raíz del frontend, edita `js/config.js` con la URL HTTPS proporcionada por el hosting, incluyendo `/api`:

```js
window.SERVI_API_URL = 'https://TU-DOMINIO-API/api';
```

Publica el cambio en el repositorio que alimenta GitHub Pages. No uses `http://moises-mc.github.io:8000/api`.


### Variables para verificación y recuperación

Configura en Vercel (Project Settings → Environment Variables):

- `RESEND_API_KEY`: clave API de Resend.
- `RESEND_FROM_EMAIL`: remitente verificado en Resend, por ejemplo `Servi Choquib <no-reply@tudominio.com>`.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`: credenciales y número remitente de Twilio.

El registro requiere correo configurado. El SMS de recuperación solo se envía a teléfonos que el usuario haya verificado desde su perfil. Los números deben ser colombianos o internacionales y se normalizan a E.164 cuando son números móviles colombianos de 10 dígitos.


### Correo transaccional con Gmail SMTP

Configura en Vercel (Production y Preview si corresponde):
- `GMAIL_USER`: cuenta Gmail exclusiva de Servi Choquib.
- `GMAIL_APP_PASSWORD`: contraseña de aplicación de Google (no la contraseña normal).
- `EMAIL_FROM`: `Servi Choquib <cuenta@gmail.com>` usando la misma cuenta autorizada.

No publiques la contraseña de aplicación ni la incluyas en el repositorio. Gmail es una opción inicial con límites de envío; para mayor volumen conviene un proveedor transaccional con dominio propio.
