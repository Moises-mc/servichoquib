import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;
let activePool = new Pool({
  ...(env.db.connectionString
    ? {
        connectionString: env.db.connectionString,
        // Neon requiere TLS. El certificado se valida por defecto.
        ssl: { rejectUnauthorized: env.db.sslRejectUnauthorized },
      }
    : {
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
        user: env.db.user,
        password: env.db.password,
        ...(env.db.ssl ? { ssl: { rejectUnauthorized: env.db.sslRejectUnauthorized } } : {}),
      }),
  max: env.db.poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 7_000,
  application_name: 'servi-choquib-api',
});
activePool.on('error', error => {
  console.error('Error inesperado en el pool PostgreSQL:', error.message);
});

const schemaName = env.db.schema;
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaName)) {
  throw new Error('DB_SCHEMA solo puede contener letras, números y guion bajo, y no puede iniciar con número.');
}
export const schema = `"${schemaName}"`;
export const table = name => {
  if (!/^[a-z_]+$/.test(name)) throw new Error('Nombre de tabla no válido.');
  return `${schema}."${name}"`;
};

export function query(text, params) {
  return activePool.query(text, params);
}

export async function initializeDatabase() {
  // La conexión valida host, puerto, usuario, contraseña y disponibilidad del servidor.
  await activePool.query('SELECT 1');
  await activePool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const migrationsDir = fileURLToPath(new URL('./migrations/', import.meta.url));
  const { readdir } = await import('node:fs/promises');
  const migrationFiles = (await readdir(migrationsDir)).filter(name => /^\d+_.*\.sql$/.test(name)).sort();
  for (const filename of migrationFiles) {
    const migrationPath = fileURLToPath(new URL(`./migrations/${filename}`, import.meta.url));
    const migration = (await readFile(migrationPath, 'utf8')).replaceAll('{{schema}}', schema);
    await activePool.query(migration);
  }
  return true;
}

export async function closeDatabase() {
  await activePool.end();
}

// Sustituye el pool únicamente en pruebas automatizadas; nunca se expone por HTTP.
export function setPoolForTests(pool) {
  activePool = pool;
}
