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
  cors(corsOptions),
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", 'https://unpkg.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
      },
    },
  }),
];

// Helper para extraer la IP cliente detrás de proxies (Vercel, AWS Lambda, CDN)
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: getClientIp,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: getClientIp,
  message: { error: 'Demasiados intentos. Intenta más tarde.' },
});
