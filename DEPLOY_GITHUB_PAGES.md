# Publicar Servi Choquib: GitHub Pages + backend + PostgreSQL

## Qué significa el error `moises-mc.github.io:8000`

GitHub Pages solo aloja HTML/CSS/JavaScript. No ejecuta el proceso Node.js en el puerto 8000. El backend debe tener una URL pública HTTPS independiente.

## 1. Desplegar el backend

Publica el contenido de `server/` como un servicio Node.js (Node 18.18 o superior):

- Directorio raíz: `server`
- Instalación: `npm install`
- Inicio: `npm start`
- Puerto: usa `process.env.PORT` (el código ya lo lee)

Configura estas variables de entorno en el hosting:

```env
NODE_ENV=production
CLIENT_ORIGIN=https://moises-mc.github.io
JWT_SECRET=GENERA_UN_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
DB_SCHEMA=servi_choquib
DB_POOL_MAX=10
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

Para PostgreSQL, configura una de estas opciones:

**Opción A — el proveedor entrega `DATABASE_URL`:**

```env
DATABASE_URL=postgresql://USUARIO:CLAVE@HOST:5432/BASE
```

**Opción B — parámetros individuales:**

```env
DB_HOST=HOST_POSTGRES
DB_PORT=5432
DB_NAME=NOMBRE_BASE
DB_USER=USUARIO
DB_PASSWORD=CLAVE
```

Activa `DB_SSL=true` solo si el proveedor de PostgreSQL requiere TLS. No imprimas ni compartas la cadena `DATABASE_URL`.

> `localhost` en un hosting es el propio servidor de backend. No apunta a PostgreSQL de tu PC. Para producción usa una base administrada/alcanzable desde el hosting. Nunca expongas el puerto 5432 de tu computador directamente a Internet.

## 2. Comprobar el backend

Cuando el hosting entregue una URL, visita:

```text
https://TU-DOMINIO-API/api/health
```

Debe devolver JSON con `ok: true` y `database: "connected"`. Si falla, revisa los logs del backend y sus variables de base de datos antes de continuar.

## 3. Apuntar el frontend a la API desplegada

Edita `js/config.js` y sustituye el valor por la URL pública real del backend, terminada en `/api`:

```js
window.SERVI_API_URL = 'https://TU-DOMINIO-API/api';
```

Haz commit/push al repositorio que publica GitHub Pages. No escribas `http://moises-mc.github.io:8000/api`: esa dirección no ejecuta el backend.

## 4. CORS

En las variables de entorno del backend define exactamente:

```env
CLIENT_ORIGIN=https://moises-mc.github.io
```

El origen no debe incluir `/`, rutas ni el puerto de la API. Si cambias el dominio del frontend, actualiza este valor y reinicia/re-despliega el backend.

## 5. Desarrollo local

Para desarrollo local, deja `js/config.js` sin URL pública y abre Live Server en `http://127.0.0.1:5500` o `http://localhost:5500`. El backend debe ejecutarse localmente en el puerto 8000 y PostgreSQL local en 5432.
