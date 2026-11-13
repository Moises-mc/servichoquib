import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { env } from '../config/env.js';

// Autoriza los dominios configurados y el mismo origen de la petición.
// Esto permite que cada deployment de Vercel (preview/production) consuma
// su propia API mediante /api sin tener que registrar cada URL temporal.
const corsOptionsForRequest = (req) => {
  const requestHost = String(req.get('x-forwarded-host') || req.get('host') || '')
    .split(',')[0].trim().toLowerCase();
  const requestProtocol = String(req.get('x-forwarded-proto') || req.protocol || '')
    .split(',')[0].trim().toLowerCase();

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      let originHost = '';
      let originProtocol = '';
      try {
        const parsedOrigin = new URL(origin);
        originHost = parsedOrigin.host.toLowerCase();
        originProtocol = parsedOrigin.protocol.replace(':', '').toLowerCase();
      } catch {
        // Un Origin malformado no se autoriza.
      }

      const isSameOrigin = Boolean(
        requestHost && originHost === requestHost &&
        requestProtocol && originProtocol === requestProtocol
      );
      if (isSameOrigin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error(`Origen no permitido por CORS: ${origin}`);
      error.status = 403;
      return callback(error);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  };
};

const corsForRequest = (req, res, next) =>
  cors(corsOptionsForRequest(req))(req, res, next);

export const security = [
  // CORS se ejecuta antes de Helmet y del rate limiter para responder OPTIONS
  // (preflight) antes de que Express procese la ruta real.
  corsForRequest,
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", 'https://unpkg.com'],
        // La interfaz usa atributos onclick en el HTML y en vistas generadas.
        // Permitir solo atributos de evento evita habilitar scripts inline completos.
        'script-src-attr': ["'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
      },
    },
  }),
];

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta más tarde.' },
});
