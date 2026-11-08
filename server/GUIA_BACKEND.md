# Guía de arquitectura del backend

Una petición sigue el flujo MVC: `HTTP → middleware → route → controller → model → PostgreSQL → JSON`.
Las rutas validan las entradas y delegan los casos de uso a los controladores; los modelos centralizan las consultas parametrizadas.

## Carpetas

| Carpeta | Responsabilidad |
| --- | --- |
| `config/` | Variables de entorno y configuración. |
| `database/` | Pool PostgreSQL y migraciones SQL versionadas. |
| `models/` | Consultas y mutaciones de usuarios, servicios, reservas, mensajes y reseñas. |
| `controllers/` | Casos de uso y respuestas HTTP. |
| `routes/` | Endpoints y validación de entradas. |
| `middleware/` | JWT, CORS, Helmet, rate limit, validación y errores. |
| `store/` | Carga inicial idempotente de datos demo. |
| `utils/` | Hash de contraseñas, errores y manejo de promesas. |
| `docs/` | Contrato OpenAPI/Swagger. |

## Inicio de base de datos

1. `src/server.js` abre y verifica el pool PostgreSQL.
2. `src/database/db.js` crea el esquema configurado en `DB_SCHEMA`.
3. `src/database/migrations/001_initial.sql` crea las tablas e índices idempotentemente.
4. `src/store/seed.js` inserta cuentas, servicios, reservas y mensajes demo si todavía no existen.
5. Se inicia Express y Socket.IO.

La conexión por defecto es a `localhost:5432`, base `postgres`, usuario `postgres`; las tablas se aíslan en el esquema `servi_choquib`. No se usa almacenamiento temporal en memoria para los datos de la aplicación.

## Lectura recomendada

1. `src/server.js`: inicializa base de datos, migraciones, seed y servidor HTTP.
2. `src/database/db.js`: pool y utilidades de acceso.
3. `src/app.js`: compone Express, Socket.IO, archivos estáticos y middleware.
4. `src/routes/`: declara endpoints y validaciones.
5. `src/controllers/`: implementa autenticación, servicios, reservas, mensajería y reseñas.
6. `src/models/`: encapsula SQL parametrizado y mapeo de filas a objetos de la aplicación.

## Buenas prácticas incluidas

- Consultas SQL parametrizadas; los nombres de esquema/tabla se validan antes de interpolarlos.
- Pool de conexiones con máximo configurable y timeout de conexión.
- Contraseñas de usuarios con `scrypt`, sal aleatoria y comparación de tiempo constante.
- Códigos de recuperación persistidos como hash y con vencimiento.
- JWT verificado y usuario vigente consultado desde PostgreSQL.
- Campos editables limitados por lista permitida; no se admite escalar el rol desde el perfil.
- Propiedad y permisos comprobados al editar servicios, reservas y mensajes.
- Claves foráneas, índices, restricciones únicas y checks de integridad.
- Archivos limitados a 5 MB y tipos permitidos; subida autenticada.
- Socket.IO autentica la conexión y solo permite unirse a la sala propia.

## Vocabulario

- `req`: petición HTTP (URL, encabezados y cuerpo).
- `res`: respuesta HTTP, por ejemplo `res.status(201).json(datos)`.
- `next()`: continúa el flujo de middleware.
- `auth`: exige `Authorization: Bearer <token>` y consulta el usuario en PostgreSQL.


### Nota opcional de reservas

`bookings.note` se guarda como cadena vacía cuando el formulario no envía una observación. No envíes `NULL` explícitamente: PostgreSQL solo aplica el valor `DEFAULT` cuando la columna se omite o se le envía un valor por defecto desde la aplicación.
