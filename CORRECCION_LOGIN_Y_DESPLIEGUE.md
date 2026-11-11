# Servi Choquib — corrección de rutas y despliegue

## Cambios incluidos

- Se eliminó la reescritura global de Vercel hacia `/index.js`. El backend Express debe recibir la ruta original (`/api/login`, `/api/health`, etc.).
- Se conservó la función Express `index.js` y se configuraron los archivos SQL de migración y recursos públicos que necesita el despliegue.
- Se fijó Node.js 24.x en el `package.json` raíz, en línea con el lockfile y el paquete del servidor.
- Se dejó explícita la URL del backend desde ambos frontends (`js/config.js` y `public/js/config.js`): `https://servichoquib.vercel.app/api`. En local usa `http://localhost:8000/api`.
- Se corrigió el controlador de reservas: ahora llama al método existente `BookingModel.updateStatus`.
- Se corrigieron los ejemplos de `CLIENT_ORIGIN`: deben ser orígenes, sin `/api/login` ni rutas adicionales.

## Variables de entorno en Vercel

Configurar para Production (y Preview si se desea probar previews):

- `NODE_ENV=production`
- `CLIENT_ORIGIN=https://moises-mc.github.io`
- `DATABASE_URL` = cadena de conexión pooled de Neon
- `DB_SCHEMA=servi_choquib`
- `DB_POOL_MAX=1`
- `JWT_SECRET` = secreto aleatorio largo, propio y privado
- `SEED_DEMO_DATA=false`

No poner la URL de login en `CLIENT_ORIGIN`. CORS compara el origen `https://moises-mc.github.io`, no la URL completa de la página ni un endpoint.

## Publicación

1. Extraer este ZIP y copiar su contenido a la raíz del repositorio `servichoquib`, conservando la estructura de carpetas.
2. Confirmar que `package.json`, `package-lock.json`, `vercel.json` e `index.js` estén en la raíz del repositorio.
3. Confirmar en Vercel que Root Directory sea `./`.
4. Enviar los cambios a la rama `main` de GitHub y esperar el despliegue de Vercel.
5. Probar `https://servichoquib.vercel.app/api/health`.
6. Probar el login desde `https://moises-mc.github.io/servichoquib/`.

## Comprobaciones realizadas

- Pruebas automatizadas: 11 de 11 aprobadas.
- Preflight de archivos para Vercel: aprobado.
- Verificación sintáctica de los archivos JavaScript modificados: aprobada.

Estas comprobaciones son locales. No sustituyen una prueba en el entorno real de Vercel/Neon, que depende de las variables de entorno y de que la base de datos esté accesible.

## Seguridad

Este paquete no incluye `server/.env`, carpetas `node_modules` ni `.git`. No subir archivos `.env` al repositorio. Si se compartió anteriormente un ZIP que contenía `server/.env`, cambiar la contraseña de Neon y regenerar `JWT_SECRET` en Vercel.
