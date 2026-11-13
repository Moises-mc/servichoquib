# Servi Choquib — historial de cambios y mejoras

Este documento reúne en un solo lugar las notas de cambios que antes estaban distribuidas en varios archivos Markdown. Está organizado por temas para facilitar su consulta.

> Las verificaciones descritas corresponden a las ejecuciones locales indicadas en cada apartado. No equivalen a una certificación del despliegue en Vercel ni de la conexión real con Neon.

## Índice
1. [Correcciones de despliegue: Vercel y Neon](#correcciones-de-despliegue-vercel-y-neon)
2. [Corrección de rutas, acceso y publicación](#correccin-de-rutas-acceso-y-publicacin)
3. [Chat, dashboard y perfil del prestador](#chat-dashboard-y-perfil-del-prestador)
4. [Paneles con datos reales y sin registros de demostración](#paneles-con-datos-reales-y-sin-registros-de-demostracin)
5. [Rediseño visual del dashboard](#rediseo-visual-del-dashboard)
6. [Identidad visual aplicada a toda la aplicación](#identidad-visual-aplicada-a-toda-la-aplicacin)
7. [Marca, logotipo e imágenes adaptables](#marca-logotipo-e-imgenes-adaptables)
8. [Fotografías de servicios sin proveedores externos](#fotografas-de-servicios-sin-proveedores-externos)

---

## Correcciones de despliegue: Vercel y Neon

### Correcciones aplicadas

1. Se alineó el `package.json` raíz con las dependencias que realmente importa el backend (`express`, `pg`, `multer`, `jsonwebtoken`, `socket.io`, etc.).
2. Se configuró el proyecto raíz como ES Modules (`type: module`), porque `index.js` y el backend utilizan `import`/`export`.
3. Se alineó Node.js a `24.x` en los manifiestos de instalación.
4. Se corrigió el pool PostgreSQL para conectarse mediante `DATABASE_URL` cuando está configurada. En ese modo utiliza TLS para Neon y respeta `DB_POOL_MAX`.
5. Se corrigió el punto de entrada serverless: Vercel exporta la aplicación Express, inicializa la base de datos de forma diferida y no ejecuta `listen()`.
6. Se implementaron las opciones que el punto de entrada ya enviaba a `createApp`: Socket.IO y almacenamiento local de archivos se desactivan en Vercel.
7. Se agregó inicialización de base de datos antes de atender rutas API en cada instancia serverless (con una promesa reutilizada por instancia caliente).
8. Se eliminó `SET search_path` como configuración de sesión, porque una sesión de un pool no garantiza que la siguiente consulta use la misma conexión. Los modelos trabajan con nombres de esquema explícitos.
9. Se corrigió la URL de API del frontend: en Vercel usa `/api` del mismo dominio; en GitHub Pages apunta a la API publicada en Vercel; en local apunta a `localhost:8000`.
10. Se agregó un script de pruebas que establece `NODE_ENV=test`, para que los tests no exijan credenciales reales de PostgreSQL.
11. Se restauró `.env.example` y se mantuvieron fuera del paquete de entrega los secretos y archivos `.env`.

### Verificaciones locales ejecutadas

Desde la raíz:

```bash
npm test
npm run check
npm run vercel:check
npm ci --dry-run --ignore-scripts --offline
```

Los 12 tests automatizados pasan; la comprobación de sintaxis revisa 52 archivos JavaScript y el preflight confirma los archivos esenciales de Vercel.

### Configuración necesaria en Vercel

- **Root Directory:** `./` (raíz del repositorio).
- **Framework Preset:** Express o detección automática.
- No configures un Output Directory manual.
- Usa Node.js `24.x`.
- Configura estas variables para Production (y Preview si corresponde):

| Variable | Valor / requisito |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL pooled de Neon, con SSL habilitado |
| `DB_SCHEMA` | `servi_choquib` |
| `DB_POOL_MAX` | `1` |
| `CLIENT_ORIGIN` | `https://moises-mc.github.io` si el frontend se sirve desde GitHub Pages; si todo está en Vercel, agrega los orígenes externos que realmente uses |
| `JWT_SECRET` | secreto aleatorio propio de al menos 32 caracteres |

No configures `DB_HOST=localhost` ni `DB_PASSWORD` en Vercel cuando uses `DATABASE_URL`. La cadena de Neon y el JWT deben guardarse únicamente en Environment Variables de Vercel.

### Antes de subir los cambios a GitHub

El ZIP original contenía `.git` y `node_modules`; no los incluyas en futuras entregas. Además, el repositorio Git actual tiene archivos de `node_modules` en su índice. Desde PowerShell, en la raíz del repositorio, ejecuta:

```powershell
git rm -r --cached node_modules server/node_modules
git add .
git commit -m "Fix Vercel deployment and Neon PostgreSQL connection"
git push
```

Si una de las carpetas no está en el índice, Git puede indicar que no la conoce; continúa con la otra. `--cached` no borra las dependencias de tu computador.

El archivo `server/.env` se excluye del índice Git, pero estaba dentro del ZIP compartido. Si contiene credenciales reales o reutilizadas en producción, cámbialas. Nunca subas `.env` a GitHub.

### Prueba después del despliegue

Abre:

- `https://TU-PROYECTO.vercel.app/`
- `https://TU-PROYECTO.vercel.app/api/health`

La segunda dirección debe responder HTTP 200 con `ok: true` y `database: "connected"`.

Después prueba registro, inicio de sesión, catálogo, reservas, mensajes y persistencia en Neon.

### Funcionalidades que requieren una configuración externa adicional

- Las cargas de archivos locales están desactivadas en Vercel porque el disco de una Function no es almacenamiento persistente. Para habilitarlas en producción hay que integrar Vercel Blob, S3 o R2.
- Socket.IO queda desactivado en el despliegue serverless actual; la mensajería REST permanece disponible. Para chat en tiempo real se necesita un servicio compatible y una estrategia de reconexión/pub-sub.
- La recuperación de contraseña necesita un proveedor de correo configurado.
- Los pagos continúan en modo sandbox.

La conexión real con Neon y el resultado del despliegue remoto no pueden certificarse desde el ZIP: requieren las variables privadas del proyecto y una ejecución en Vercel.

---

## Corrección de rutas, acceso y publicación

### Cambios incluidos

- Se eliminó la reescritura global de Vercel hacia `/index.js`. El backend Express debe recibir la ruta original (`/api/login`, `/api/health`, etc.).
- Se conservó la función Express `index.js` y se configuraron los archivos SQL de migración y recursos públicos que necesita el despliegue.
- Se fijó Node.js 24.x en el `package.json` raíz, en línea con el lockfile y el paquete del servidor.
- Se dejó explícita la URL del backend desde ambos frontends (`js/config.js` y `public/js/config.js`): `https://servichoquib.vercel.app/api`. En local usa `http://localhost:8000/api`.
- Se corrigió el controlador de reservas: ahora llama al método existente `BookingModel.updateStatus`.
- Se corrigieron los ejemplos de `CLIENT_ORIGIN`: deben ser orígenes, sin `/api/login` ni rutas adicionales.

### Variables de entorno en Vercel

Configurar para Production (y Preview si se desea probar previews):

- `NODE_ENV=production`
- `CLIENT_ORIGIN=https://moises-mc.github.io`
- `DATABASE_URL` = cadena de conexión pooled de Neon
- `DB_SCHEMA=servi_choquib`
- `DB_POOL_MAX=1`
- `JWT_SECRET` = secreto aleatorio largo, propio y privado

No poner la URL de login en `CLIENT_ORIGIN`. CORS compara el origen `https://moises-mc.github.io`, no la URL completa de la página ni un endpoint.

### Publicación

1. Extraer este ZIP y copiar su contenido a la raíz del repositorio `servichoquib`, conservando la estructura de carpetas.
2. Confirmar que `package.json`, `package-lock.json`, `vercel.json` e `index.js` estén en la raíz del repositorio.
3. Confirmar en Vercel que Root Directory sea `./`.
4. Enviar los cambios a la rama `main` de GitHub y esperar el despliegue de Vercel.
5. Probar `https://servichoquib.vercel.app/api/health`.
6. Probar el login desde `https://moises-mc.github.io/servichoquib/`.

### Corrección adicional de los botones de la página inicial

La política CSP de Helmet permitía scripts externos, pero no permitía atributos de evento HTML (`onclick`). Como los botones de acceso y exploración, además de varias acciones de la aplicación, usan esos atributos, el navegador bloqueaba sus acciones aunque los botones se vieran correctamente.

Se añadió `script-src-attr 'unsafe-inline'` para permitir únicamente atributos de evento. No se añadió `'unsafe-inline'` a `script-src`, por lo que los bloques `<script>` inline siguen bloqueados. Esto mantiene una política más restrictiva que habilitar todos los scripts inline. A largo plazo, la opción más estricta es migrar todos los `onclick` a `addEventListener` y retirar esta excepción.

### Comprobaciones realizadas

- Pruebas automatizadas: 11 de 11 aprobadas.
- Preflight de archivos para Vercel: aprobado.
- Verificación sintáctica de los archivos JavaScript modificados: aprobada.

Estas comprobaciones son locales. No sustituyen una prueba en el entorno real de Vercel/Neon, que depende de las variables de entorno y de que la base de datos esté accesible.

### Seguridad

Este paquete no incluye `server/.env`, carpetas `node_modules` ni `.git`. No subir archivos `.env` al repositorio. Si se compartió anteriormente un ZIP que contenía `server/.env`, cambiar la contraseña de Neon y regenerar `JWT_SECRET` en Vercel.

---

## Chat, dashboard y perfil del prestador

### Cambios incluidos

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

### Archivos modificados

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

### Verificación ejecutada

- `npm test`: 13 pruebas aprobadas, 0 fallidas.
- `npm run check`: sintaxis correcta en 54 archivos JavaScript.
- `npm run vercel:check`: preflight de Vercel correcto.
- Se agregó una prueba que comprueba que un usuario sin mensajes no recibe contactos en su bandeja y que un usuario con conversación sí recibe al interlocutor.

Las pruebas usan PostgreSQL en memoria (`pg-mem`); no prueban credenciales ni conectividad real con la base Neon de producción.

### Pendientes y límites

- No se probó la interfaz visual en un navegador real ni en dispositivos físicos.
- El dashboard solo considera ingresos cuando `paid = 1` y `payment_amount > 0`. Como PayU no está integrado, no se deben interpretar reservas completadas como pagos recibidos.
- La persistencia de adjuntos del chat continúa limitada al mecanismo actual que guarda el contenido en la base de datos; no se migró a almacenamiento externo.
- El endpoint `/contacts` sigue devolviendo el directorio de usuarios para las fichas públicas, pero esos usuarios no aparecen en la bandeja hasta intercambiar un mensaje.
- No se modificó el esquema SQL, por lo que no se requiere migración de Neon para estos cambios.

### Despliegue

1. Respaldar el repositorio y la base de datos antes de desplegar.
2. Sustituir el código del proyecto por el contenido de este ZIP, conservando las variables de entorno configuradas en Vercel.
3. Confirmar que el proyecto despliega el frontend desde `public/` y el backend desde la configuración actual de Vercel.
4. Subir los cambios a la rama conectada a Vercel o desplegar el ZIP mediante el flujo de trabajo habitual.
5. Esperar el despliegue y probar con dos cuentas distintas: abrir chat sin mensajes, enviar el primer mensaje, actualizar la página, buscar el nombre del contacto y comprobar que el historial permanece.
6. Probar un prestador sin servicios ni reservas y confirmar que los indicadores muestren cero y “Sin calificaciones”. Luego probar una cuenta con servicios y reseñas reales.

No se incluyen archivos `.env`, credenciales, carpetas `.git` ni `node_modules` en el ZIP.

---

## Paneles con datos reales y sin registros de demostración

### Cambios

- El arranque de Vercel solo inicializa el esquema/conexión; no ejecuta semillas ni crea usuarios, servicios, reservas o mensajes de demostración.
- Las semillas usadas por las pruebas automatizadas se movieron a `server/test/fixtures/`; no se importan desde el entrypoint de producción.
- El administrador obtiene el padrón completo desde `/api/contacts`, solo cuando su rol es `admin`. Los demás roles siguen sin recibir su propio usuario como contacto.
- El dashboard de administración calcula usuarios, servicios, reservas y comisiones a partir de los registros que devuelve la API.
- La pantalla de transacciones solo suma como pagos aquellos registros con `paid = 1` y `payment_amount > 0`. Reservas sin pago confirmado no se cuentan como ingresos.
- Los paneles muestran estados vacíos cuando no hay registros.
- El dashboard del prestador incluye actividad reciente, servicios, rendimiento e ingresos de los últimos seis meses, calculados desde sus reservas y pagos reales. No genera proyecciones.
- El gasto del cliente suma únicamente pagos confirmados.

### Importante sobre los registros que ya están en Neon

Este cambio evita nuevas inserciones automáticas de datos demo. No borra ni altera usuarios o servicios que ya existan en Neon. Si se ejecutaron semillas en producción antes de este cambio, esos registros seguirán en la base y aparecerán porque son registros persistidos. No deben eliminarse en bloque: primero hay que identificarlos y confirmar cuáles son de prueba para no borrar cuentas reales.

Consultas de solo lectura para revisar los conteos actuales:

```sql
SELECT role, COUNT(*) AS total
FROM servi_choquib.users
GROUP BY role
ORDER BY role;

SELECT COUNT(*) AS total_servicios FROM servi_choquib.services;
SELECT COUNT(*) AS total_reservas FROM servi_choquib.bookings;
SELECT COUNT(*) AS pagos_confirmados
FROM servi_choquib.bookings
WHERE paid = 1 AND payment_amount > 0;
```

### Despliegue

1. Haz una copia del repositorio actual.
2. Reemplaza los archivos del proyecto con esta versión y sube los cambios a GitHub.
3. Vercel debe desplegar la rama conectada. No agregues `SEED_DEMO_DATA`; ya no existe un interruptor de semillas en producción.
4. Después del despliegue, verifica `/api/health`, inicia sesión como administrador y comprueba que los conteos coincidan con Neon.
5. No ejecutes SQL de borrado ni migraciones de limpieza como parte de este despliegue.

PayU no fue integrado.

---

## Rediseño visual del dashboard

Se actualizó la capa visual para acercar los paneles al estilo de referencia compartido por el usuario:

- Barra lateral más amplia, oscura y con navegación activa en degradado azul/turquesa.
- Barra superior más limpia y consistente.
- Fondo azul marino con profundidad y brillos discretos.
- Tarjetas de métricas con mayor jerarquía visual, iconografía y fondos degradados.
- Paneles de dashboard con bordes sutiles, radios más amplios y mejor espaciado.
- Mejor distribución del dashboard del prestador: métricas, ingresos, actividad reciente, servicios y rendimiento.
- Ajustes responsive para tabletas y móviles.
- Se conservaron los datos y estados vacíos reales; no se agregaron usuarios, servicios, reservas, ingresos ni reseñas de demostración.

Archivos actualizados:
- `style.css`
- `public/style.css`

No se modificó la lógica de negocio ni se hicieron cambios en la base Neon. La referencia visual es una guía de estilo; el resultado final puede variar según los datos reales, las dimensiones de pantalla y los elementos que tenga la cuenta.

### Validación
- `npm run vercel:check`: correcto.
- `node --check` sobre los archivos JavaScript de `js/`, `public/js/` y `server/src/`: correcto.
- `npm test`: no se pudo completar en este entorno porque no está instalado el paquete de desarrollo `pg-mem` (`ERR_MODULE_NOT_FOUND`). Instalar dependencias con `npm ci` antes de ejecutar las pruebas completas.

---

## Identidad visual aplicada a toda la aplicación

Se amplió la identidad visual azul marino, índigo y turquesa a toda la interfaz:

- Portada pública y navegación.
- Inicio de sesión y registro.
- Paneles de cliente, prestador y administrador.
- Catálogo y tarjetas de servicios.
- Perfil público y edición del perfil.
- Chat y conversaciones.
- Tablas, filtros, formularios, botones y ventanas modales.
- Estados vacíos y adaptación para tabletas y celulares.

Los cambios de esta entrega son de presentación (CSS). No se modificaron consultas, registros, usuarios, servicios, reservas ni pagos. Se conservaron los cambios funcionales que ya venían en el ZIP de entrada.

### Archivos de estilos
- `style.css`
- `public/style.css`

Ambos archivos se mantienen sincronizados.

### Validación realizada
- `node --check` en los archivos JavaScript: correcto.
- Preflight de Vercel: correcto.
- Balance de llaves CSS y sincronización de hojas de estilo: correcto.
- `npm test`: no pudo ejecutarse porque no está instalada la dependencia de desarrollo `pg-mem` en este entorno. Instalar dependencias con `npm ci` antes de ejecutar las pruebas.

Esta entrega no fue desplegada en Vercel ni comprobada contra Neon. No incluye integración de almacenamiento de imágenes; esa funcionalidad requiere definir y configurar un proveedor de almacenamiento persistente.

---

## Marca, logotipo e imágenes adaptables

Se aplicó el logotipo seleccionado por el usuario (símbolo S azul/blanco con órbita y wordmark ServiChoquib).

- `public/assets/servi-choquib-logo.png`: logo completo para encabezado y pantalla de acceso.
- `public/assets/servi-choquib-icon.png`: símbolo cuadrado para navegación e icono de la app.
- `public/assets/favicon.ico` y `favicon-64.png`: iconos del navegador.
- `public/assets/apple-touch-icon.png`: icono de acceso directo en iOS.
- `public/site.webmanifest`: metadatos e iconos para navegadores compatibles.

Los recursos se referencian con rutas absolutas desde la raíz (`/assets/...`) para evitar fallos al abrir la app desde rutas internas. Se añadieron reglas responsive para que el logo conserve su proporción en pantallas pequeñas.

---

## Fotografías de servicios sin proveedores externos

La carga de imágenes de servicios utiliza el mismo mecanismo del perfil: el navegador lee la imagen como Data URL/Base64 y la envía en JSON al backend. El backend valida tipo y tamaño y guarda la cadena en `services.img` (columna TEXT existente en Neon).

- Formatos admitidos: JPG/JPEG, PNG, WEBP y GIF.
- Tamaño máximo del archivo original: 1,2 MB.
- Vista previa antes de guardar.
- Al editar, si no se selecciona otra foto se conserva la actual; el botón «Quitar fotografía» permite eliminarla.
- El catálogo, el detalle del servicio, el panel del prestador y la gestión administrativa muestran la imagen guardada.
- No requiere Cloudinary, Vercel Blob ni una migración de base de datos: `services.img` ya existe como TEXT.

Nota técnica: Base64 aumenta el tamaño del archivo aproximadamente un 33%. Se limita a 1,2 MB para ajustarse al límite JSON de 2 MB configurado en Express. Las imágenes se almacenan en Neon, por lo que aumentan el tamaño y el consumo de la base de datos; conviene mantener el límite y evitar imágenes originales pesadas.

---


## Recuperación de contraseña en dos pasos y envío por Gmail

- El formulario se separó en dos pantallas: solicitar código y, después de una respuesta satisfactoria de la API, verificar el código y definir la nueva contraseña.
- Se añadió confirmación de contraseña, validación del código de seis dígitos, botón para reenviar y opción para cambiar el correo o método.
- El backend acepta configuración Gmail mediante `GMAIL_USER`, `GMAIL_APP_PASSWORD` y `EMAIL_FROM`, manteniendo Resend como alternativa si está configurado.
- Los errores de configuración/envío clasificados como HTTP 503 ahora devuelven un mensaje operativo en lugar del genérico «Error interno del servidor».
- Los códigos continúan almacenándose como hash, con vencimiento y límite de intentos ya implementados.
- La entrega no confirma envío real desde Gmail: debe probarse en Vercel con las variables correctas y los permisos de la cuenta.


## Recuperación de contraseña en dos pasos y compatibilidad con Gmail

- El formulario de recuperación ahora comienza solicitando únicamente el correo y el método de entrega.
- Solo después de que la API acepte la solicitud se muestra el segundo paso: código de seis dígitos, nueva contraseña y confirmación.
- Se agregaron validaciones de formato del código, longitud de contraseña y coincidencia de contraseñas, además de opciones para reenviar el código o cambiar el correo.
- El código anterior esperaba exclusivamente `RESEND_API_KEY` y `RESEND_FROM_EMAIL`. Como la configuración indicada por el usuario era Gmail (`GMAIL_USER`, `GMAIL_APP_PASSWORD` y `EMAIL_FROM`), esa diferencia explica el error de configuración de correo detectado en el código.
- Se añadió envío SMTP seguro de Gmail con TLS por el puerto 465, sin instalar un proveedor externo. Resend sigue disponible como alternativa cuando ambas variables de Resend están configuradas.
- Los errores operativos HTTP 503 de correo ahora muestran el motivo seguro y accionable; los errores internos inesperados siguen ocultándose al usuario.

### Variables necesarias en Vercel para Gmail

- `GMAIL_USER`: cuenta Gmail completa.
- `GMAIL_APP_PASSWORD`: contraseña de aplicación de Google (no la contraseña normal de Gmail).
- `EMAIL_FROM`: por ejemplo `Servi Choquib <cuenta@gmail.com>`, usando la misma cuenta autorizada en Gmail.

La cuenta debe tener activada la verificación en dos pasos y una contraseña de aplicación válida. El envío real debe probarse después del despliegue, porque esta revisión local no puede validar las credenciales privadas ni la salida SMTP de la función de Vercel.
