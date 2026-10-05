import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { env } from '../config/env.js';

export const security = [
  helmet(),
  cors({ origin: env.clientOrigin, credentials: true }),
];

export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8' });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { error: 'Demasiados intentos. Intenta más tarde.' } });
