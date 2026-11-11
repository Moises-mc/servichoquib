import { fileURLToPath } from 'node:url';

// dotenv solo es necesario para desarrollo local.
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');

  dotenv.config({
    path: fileURLToPath(new URL('../../.env', import.meta.url))
  });
}

const nodeEnv = process.env.NODE_ENV || 'development';

// Orígenes permitidos por defecto para desarrollo, Vercel y GitHub Pages
const standardOrigins = [
  'https://servichoquib.vercel.app',
  'https://moises-mc.github.io',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];
const envOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(v => v.trim()).filter(Boolean)
  : [];
const configuredOrigins = Array.from(new Set([...envOrigins, ...standardOrigins]));

const allowedOrigins = new Set();
for (const value of configuredOrigins) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    console.warn(`[CONFIG] CLIENT_ORIGIN contiene un origen no válido: ${value}`);
    continue;
  }
  allowedOrigins.add(parsed.origin);

  if (['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    parsed.hostname = parsed.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
    allowedOrigins.add(parsed.origin);
  }
}

const clientOrigins = [...allowedOrigins];

const fallbackJwtSecret = 'servi-choquib-default-secret-production-change-in-env-2026';
const configuredJwt = process.env.JWT_SECRET || (nodeEnv === 'production' ? fallbackJwtSecret : 'development-only-change-me');

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 8000),
  clientOrigins,
  jwtSecret: configuredJwt,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  paymentsMode: process.env.PAYMENTS_MODE || 'sandbox',
  seedDemoData: String(process.env.SEED_DEMO_DATA ?? (nodeEnv !== 'production')).toLowerCase() === 'true',
  db: {
    connectionString: String(process.env.DATABASE_URL || '').trim(),
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    schema: process.env.DB_SCHEMA || 'servi_choquib',
    poolMax: Number(process.env.DB_POOL_MAX || (nodeEnv === 'production' ? 1 : 10)),
    ssl: String(process.env.DB_SSL || 'false').toLowerCase() === 'true',
    sslRejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false',
  },
};

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT debe ser un puerto válido entre 1 y 65535.');
}
if (!Number.isInteger(env.db.port) || env.db.port < 1 || env.db.port > 65535) {
  throw new Error('DB_PORT debe ser un puerto válido entre 1 y 65535.');
}
if (!Number.isInteger(env.db.poolMax) || env.db.poolMax < 1 || env.db.poolMax > 50) {
  throw new Error('DB_POOL_MAX debe estar entre 1 y 50.');
}

if (env.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET) {
    console.warn('[CONFIG] JWT_SECRET no configurado en variables de entorno de producción. Se recomienda definir uno propio de al menos 32 caracteres.');
  }
  if (!env.db.connectionString && !env.db.password) {
    console.warn('[CONFIG] DATABASE_URL no está configurada en las variables de entorno de Vercel.');
  }
} else {
  if (!env.db.connectionString && (!env.db.host || !env.db.database || !env.db.user)) {
    throw new Error('Configura DATABASE_URL o completa DB_HOST, DB_NAME y DB_USER.');
  }
  if (!env.db.connectionString && !env.db.password) {
    throw new Error('DB_PASSWORD está vacío. Completa server/.env con la contraseña de PostgreSQL.');
  }
}
