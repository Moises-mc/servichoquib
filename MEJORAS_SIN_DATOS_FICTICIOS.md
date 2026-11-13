# Servi Choquib — paneles sin datos ficticios

## Cambios

- El arranque de Vercel solo inicializa el esquema/conexión; no ejecuta semillas ni crea usuarios, servicios, reservas o mensajes de demostración.
- Las semillas usadas por las pruebas automatizadas se movieron a `server/test/fixtures/`; no se importan desde el entrypoint de producción.
- El administrador obtiene el padrón completo desde `/api/contacts`, solo cuando su rol es `admin`. Los demás roles siguen sin recibir su propio usuario como contacto.
- El dashboard de administración calcula usuarios, servicios, reservas y comisiones a partir de los registros que devuelve la API.
- La pantalla de transacciones solo suma como pagos aquellos registros con `paid = 1` y `payment_amount > 0`. Reservas sin pago confirmado no se cuentan como ingresos.
- Los paneles muestran estados vacíos cuando no hay registros.
- El dashboard del prestador incluye actividad reciente, servicios, rendimiento e ingresos de los últimos seis meses, calculados desde sus reservas y pagos reales. No genera proyecciones.
- El gasto del cliente suma únicamente pagos confirmados.

## Importante sobre los registros que ya están en Neon

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

## Despliegue

1. Haz una copia del repositorio actual.
2. Reemplaza los archivos del proyecto con esta versión y sube los cambios a GitHub.
3. Vercel debe desplegar la rama conectada. No agregues `SEED_DEMO_DATA`; ya no existe un interruptor de semillas en producción.
4. Después del despliegue, verifica `/api/health`, inicia sesión como administrador y comprueba que los conteos coincidan con Neon.
5. No ejecutes SQL de borrado ni migraciones de limpieza como parte de este despliegue.

PayU no fue integrado.
