# Servi Choquib API — PostgreSQL

API Express con arquitectura MVC y persistencia PostgreSQL usando `pg` (node-postgres).

## Arranque en Windows PowerShell

```powershell
# Dentro de la carpeta server
npm install
npm run dev
```

El archivo `server/.env` incluido en el paquete contiene la conexión local que indicó el usuario. Si no existe, copia `.env.example` a `.env` y completa `DB_PASSWORD`.

Al iniciar, el backend prueba la conexión, crea el esquema `servi_choquib` en la base `postgres`, aplica `src/database/migrations/001_initial.sql` y siembra datos demo sin duplicarlos. No hace falta crear tablas desde DBeaver.

## Configuración PostgreSQL

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_contraseña_local
DB_SCHEMA=servi_choquib
DB_POOL_MAX=10
```

## Verificación

```powershell
npm run db:check
npm test
npm run check
```

`npm test` usa `pg-mem` para probar API y modelos sin alterar tu PostgreSQL local. `npm run db:check` comprueba la conexión real configurada en `.env`.


## Corrección de reservas sin observación

El campo `bookings.note` es obligatorio en PostgreSQL y tiene por defecto una cadena vacía. El modelo también normaliza `note` a `''` cuando el cliente o la carga inicial no envían ese campo; así no se envía `NULL` explícito (que omitiría el `DEFAULT` de PostgreSQL). Las reservas demo antiguas que se creen por primera vez también incluyen `note: ''`.

Si el servidor se detuvo durante la carga inicial, vuelve a ejecutar `npm run dev`. La siembra es idempotente: conserva las cuentas y servicios que ya se insertaron y completa las reservas y mensajes faltantes sin borrar datos.
