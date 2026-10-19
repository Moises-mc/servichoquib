# Guia para entender el backend

Una API recibe una peticion del frontend, ejecuta una regla y devuelve JSON.

`frontend -> middleware -> ruta -> datos -> respuesta JSON`

## Carpetas

| Carpeta | Para que sirve |
| --- | --- |
| `config/` | Puerto, secreto JWT y otras variables. |
| `middleware/` | Seguridad y autenticacion antes de las rutas. |
| `routes/` | Endpoints `GET`, `POST`, `PUT` y `DELETE`. |
| `store/` | Datos temporales; despues se cambia por una base de datos. |
| `docs/` | Contrato que Swagger muestra. |

## Lee en este orden

1. `src/server.js`: crea el servidor y conecta todas las piezas.
2. `src/routes/auth.routes.js`: login, registro y perfil.
3. `src/middleware/auth.js`: validacion del token JWT.
4. `src/routes/app.routes.js`: servicios, reservas y mensajes.

## Vocabulario esencial

- `req`: lo que envio el cliente (URL, headers y cuerpo JSON).
- `res`: la respuesta del backend; por ejemplo `res.status(201).json(datos)`.
- `next()`: continua al siguiente middleware.
- `auth`: exige `Authorization: Bearer <token>`.
