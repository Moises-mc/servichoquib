# Mejoras verificadas — Servi Choquib

## Cambios incluidos

- La bandeja del chat ahora consume `GET /conversations`, que devuelve exclusivamente usuarios con al menos un mensaje intercambiado con la cuenta autenticada.
- Se conserva `GET /contacts` como directorio interno para resolver perfiles desde el catálogo; ya no se utiliza para poblar la lista de chats.
- La conversación se agrupa de forma persistente por la pareja de usuarios en la tabla `messages`; al volver a abrirla se recupera el historial existente. No se crea una fila de chat por cada mensaje ni se duplican contactos.
- El buscador filtra solo la lista de conversaciones existentes, por nombre, sin distinguir mayúsculas ni tildes.
- Se añadieron estados vacíos para una bandeja sin conversaciones, una búsqueda sin resultados y un chat sin mensajes.
- El dashboard del prestador calcula servicios activos desde sus servicios, solicitudes de hoy desde reservas creadas hoy, ingresos desde reservas efectivamente marcadas como pagadas y calificación ponderada por reseñas reales. Sin datos muestra cero o “Sin calificaciones”.
- Las imágenes de servicios aceptan URLs válidas, convierten identificadores de fotos Unsplash ya guardados en URLs completas y usan el icono local como respaldo ante imágenes faltantes o rotas.
- Se eliminó la segunda imagen repetida del formulario de perfil; la foto principal del perfil sigue visible.
- Se añadieron ajustes responsive para las tarjetas del dashboard y los estados del chat.
- Se actualizó el espejo de los archivos del frontend bajo `public/`, que es la copia servida por el despliegue.

## Archivos modificados

- `server/src/models/message.model.js`
- `server/src/controllers/users.controller.js`
- `server/src/routes/users.routes.js`
- `server/src/docs/openapi.js`
- `server/test/api.test.js`
- `js/services/api.service.js`
- `js/controllers/chat.controller.js`
- `js/views/chat.views.js`
- `js/views/provider-admin.views.js`
- `js/views/profile.view.js`
- `style.css`
- Copias equivalentes bajo `public/js/` y `public/style.css`.

## Verificación ejecutada

- `npm test`: 13 pruebas aprobadas, 0 fallidas.
- `npm run check`: sintaxis correcta en 54 archivos JavaScript.
- `npm run vercel:check`: preflight de Vercel correcto.
- Se agregó una prueba que comprueba que un usuario sin mensajes no recibe contactos en su bandeja y que un usuario con conversación sí recibe al interlocutor.

Las pruebas usan PostgreSQL en memoria (`pg-mem`); no prueban credenciales ni conectividad real con la base Neon de producción.

## Pendientes y límites

- No se probó la interfaz visual en un navegador real ni en dispositivos físicos.
- El dashboard solo considera ingresos cuando `paid = 1` y `payment_amount > 0`. Como PayU no está integrado, no se deben interpretar reservas completadas como pagos recibidos.
- La persistencia de adjuntos del chat continúa limitada al mecanismo actual que guarda el contenido en la base de datos; no se migró a almacenamiento externo.
- El endpoint `/contacts` sigue devolviendo el directorio de usuarios para las fichas públicas, pero esos usuarios no aparecen en la bandeja hasta intercambiar un mensaje.
- No se modificó el esquema SQL, por lo que no se requiere migración de Neon para estos cambios.

## Despliegue

1. Respaldar el repositorio y la base de datos antes de desplegar.
2. Sustituir el código del proyecto por el contenido de este ZIP, conservando las variables de entorno configuradas en Vercel.
3. Confirmar que el proyecto despliega el frontend desde `public/` y el backend desde la configuración actual de Vercel.
4. Subir los cambios a la rama conectada a Vercel o desplegar el ZIP mediante el flujo de trabajo habitual.
5. Esperar el despliegue y probar con dos cuentas distintas: abrir chat sin mensajes, enviar el primer mensaje, actualizar la página, buscar el nombre del contacto y comprobar que el historial permanece.
6. Probar un prestador sin servicios ni reservas y confirmar que los indicadores muestren cero y “Sin calificaciones”. Luego probar una cuenta con servicios y reseñas reales.

No se incluyen archivos `.env`, credenciales, carpetas `.git` ni `node_modules` en el ZIP.
