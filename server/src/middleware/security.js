import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { env } from '../config/env.js';

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
    const error = new Error(`Origen no permitido por CORS: ${origin}`);
    error.status = 403;
    return callback(error);
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

export const security = [
  // CORS se ejecuta antes de Helmet y del rate limiter para responder OPTIONS
  // (preflight) antes de que Express procese la ruta real.
  cors(corsOptions),
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
