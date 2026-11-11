import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;
let activePool = null;

export function getPool() {
  if (!activePool) {
    const isNeon = env.db.connectionString.includes('neon.tech');
    const enableSsl = env.db.ssl || isNeon || (env.nodeEnv === 'production' && Boolean(env.db.connectionString));

    activePool = new Pool({
      ...(env.db.connectionString
        ? { connectionString: env.db.connectionString }
        : {
            host: env.db.host,
            port: env.db.port,
            database: env.db.database,
            user: env.db.user,
            password: env.db.password,
          }),
      ...(enableSsl ? { ssl: { rejectUnauthorized: env.db.sslRejectUnauthorized && !isNeon } } : {}),
      max: env.db.poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 7_000,
      application_name: 'servi-choquib-api',
    });
    activePool.on('error', error => {
      console.error('Error inesperado en el pool PostgreSQL:', error.message);
    });
  }
  return activePool;
}

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
  if (!env.db.connectionString && env.nodeEnv === 'production' && !env.db.password) {
    const error = new Error('DATABASE_URL no está configurada en las variables de entorno de Vercel. Configura la base de datos Neon en los ajustes de Vercel.');
    error.status = 503;
    return Promise.reject(error);
  }
  return getPool().query(text, params);
}

export async function initializeDatabase() {
  if (!env.db.connectionString && env.nodeEnv === 'production' && !env.db.password) {
    console.warn('Conexión PostgreSQL omitida: falta DATABASE_URL en Vercel.');
    return false;
  }
  const pool = getPool();
  // La conexión valida host, puerto, usuario, contraseña y disponibilidad del servidor.
  await pool.query('SELECT 1');
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  const { readFile } = await import('node:fs/promises');
  const { fileURLToPath } = await import('node:url');
  const migrationPath = fileURLToPath(new URL('./migrations/001_initial.sql', import.meta.url));
  const migration = (await readFile(migrationPath, 'utf8')).replaceAll('{{schema}}', schema);
  await pool.query(migration);
  // No ejecutar SET search_path: Neon pooled usa PgBouncer en modo transaccional.
  // Todos los modelos referencian el esquema explícitamente mediante table().
  return true;
}

export async function closeDatabase() {
  if (activePool) {
    await activePool.end();
    activePool = null;
  }
}

// Sustituye el pool únicamente en pruebas automatizadas; nunca se expone por HTTP.
export function setPoolForTests(pool) {
  activePool = pool;
}
