# Servi Choquib API

API Express organizada sin base de datos. El módulo `src/store/memory.js` es el único punto que debes reemplazar cuando conectes SQLite, PostgreSQL o MongoDB.

## Arranque

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## Demo

- Ana: `ana@email.com` / `ana12345`
- Carlos: `carlos@email.com` / `carlos12345`
- Marco: `marco@email.com` / `marco12345`

## Swagger

Con el servidor iniciado, abre `http://localhost:4000/api-docs`. El contrato OpenAPI en formato JSON está disponible en `http://localhost:4000/api-docs.json`.

Para probar rutas protegidas, inicia sesión en `POST /api/login`, copia el valor de `token` y pégalo en **Authorize** como Bearer token.

## Capas

- `config/`: variables de entorno.
- `middleware/`: autenticación y seguridad.
- `routes/`: endpoints de autenticación, servicios, reservas, chat y reseñas.
- `services/`: reservado para pagos, correo y notificaciones.
- `store/`: almacenamiento temporal que luego reemplazarás por tu base de datos.

## Pendiente de conectar con proveedor real

- Pago Wompi/PayU.
- Correo o SMS para recuperación de contraseña.
- Persistencia de archivos.
- Repositorio de base de datos.
