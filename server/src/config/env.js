import { fileURLToPath } from 'node:url';

// dotenv solo es necesario para desarrollo local.
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');

  dotenv.config({
    path: fileURLToPath(new URL('../../.env', import.meta.url))
  });
}

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultClientOrigins = nodeEnv === 'production'
  ? 'https://servichoquib.vercel.app'
  : 'http://localhost:5500,http://127.0.0.1:5500,https://moises-mc.github.io';
// Si CLIENT_ORIGIN existe pero está vacío en Vercel, usar el dominio público
// de producción en vez de dejar la lista CORS completamente vacía.
const configuredOrigins = String(
  process.env.CLIENT_ORIGIN || defaultClientOrigins,
)
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

// En desarrollo, localhost y 127.0.0.1 representan el mismo equipo.
// Live Server puede abrir la app con cualquiera de los dos hostnames aunque
// CLIENT_ORIGIN se haya generado previamente con solo uno de ellos.
const allowedOrigins = new Set();
for (const value of configuredOrigins) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`CLIENT_ORIGIN contiene un origen inválido: ${value}`);
  }
  allowedOrigins.add(parsed.origin);

  if (nodeEnv !== 'production' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) {
    parsed.hostname = parsed.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
    allowedOrigins.add(parsed.origin);
  }
}

const clientOrigins = [...allowedOrigins];

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 8000),
  clientOrigins,
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  paymentsMode: process.env.PAYMENTS_MODE || 'sandbox',
  email: { resendApiKey: process.env.RESEND_API_KEY || '', from: process.env.RESEND_FROM_EMAIL || '' },
  sms: { accountSid: process.env.TWILIO_ACCOUNT_SID || '', authToken: process.env.TWILIO_AUTH_TOKEN || '', from: process.env.TWILIO_FROM_NUMBER || '' },
  db: {
    connectionString: String(process.env.DATABASE_URL || '').trim(),
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    schema: process.env.DB_SCHEMA || 'servi_choquib',
    poolMax: Number(process.env.DB_POOL_MAX || 10),
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
if (env.nodeEnv === 'production' && (env.jwtSecret === 'development-only-change-me' || env.jwtSecret.includes('pon-aqui'))) {
  throw new Error('Configura un JWT_SECRET aleatorio; no uses el valor de ejemplo en producción.');
}
if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
}

if (!env.db.connectionString && (!env.db.host || !env.db.database || !env.db.user)) {
  throw new Error('Configura DATABASE_URL o completa DB_HOST, DB_NAME y DB_USER.');
}
if (env.nodeEnv !== 'test' && !env.db.connectionString && !env.db.password) {
  throw new Error('DB_PASSWORD está vacío. Completa server/.env con la contraseña de PostgreSQL.');
}
