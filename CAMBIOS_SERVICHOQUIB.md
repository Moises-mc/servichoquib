# Cambios de esta versión — Servi Choquib

## Correo Gmail
El backend ahora usa SMTP seguro de Gmail (smtp.gmail.com, TLS/465) con contraseña de aplicación.
Configura en Vercel:
- GMAIL_USER
- GMAIL_APP_PASSWORD
- EMAIL_FROM

`EMAIL_FROM` debe tener el formato `Servi Choquib <correo-real@gmail.com>` y usar la cuenta autorizada.
No agregues comillas alrededor del valor. No subas `.env` al repositorio.

## Panel administrativo
- Indicadores calculados desde PostgreSQL: usuarios, clientes, prestadores, servicios, contrataciones y pagos registrados.
- Gestión de usuarios con búsqueda y suspensión/reactivación.
- Moderación para activar/desactivar publicaciones.
- Seguimiento de contrataciones.
- Transacciones basadas únicamente en registros marcados como pagados; no se inventan pagos ni comisiones.
- Las rutas administrativas exigen sesión autenticada y rol `admin`.
- Las cuentas administradoras no se pueden suspender desde el panel y un administrador no puede suspenderse a sí mismo.

La migración `003_admin_controls.sql` agrega el campo `is_active`; se ejecuta con el inicializador de base de datos del proyecto.

## Otros ajustes
- Express confía en el proxy de Vercel para interpretar correctamente `X-Forwarded-For` y el rate limiter.
- Se excluyeron archivos `.env`, `.git` y `node_modules` del ZIP.

## Despliegue
1. Sube el contenido de este ZIP a tu repositorio GitHub (sin añadir `.env`).
2. En Vercel confirma las tres variables de Gmail en Production.
3. Despliega de nuevo.
4. Prueba el registro con un correo distinto al Gmail remitente y revisa también Spam.

## Importante
El envío real de correo requiere probarlo en Vercel con las credenciales Gmail correctas. Las pruebas automatizadas completas no se pudieron ejecutar en este entorno porque no se instaló `pg-mem`; sí se verificó la sintaxis de los archivos de código modificados y el preflight de Vercel.

El ZIP original contenía `server/.env` con credenciales de configuración. Ese archivo fue excluido de esta entrega. Por precaución, rota el `JWT_SECRET` y la contraseña de la base de datos si esos valores siguen vigentes, y actualiza las variables correspondientes en Vercel.
