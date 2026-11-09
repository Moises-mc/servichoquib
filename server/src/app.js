import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { security, apiLimiter } from './middleware/security.js';
import { auth } from './middleware/auth.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import { UserModel } from './models/user.model.js';
import authRoutes from './routes/auth.routes.js';
import appRoutes from './routes/app.routes.js';
import { openapi } from './docs/openapi.js';
import { uploadFile } from './controllers/uploads.controller.js';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
]);

function configureSockets(io) {
  io.use((socket, next) => {
    const authorization = socket.handshake.headers.authorization || '';
    const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const token = socket.handshake.auth?.token || bearerToken;
    if (!token) return next(new Error('Autenticación requerida.'));

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      UserModel.findById(payload.id).then(user => {
        if (!user) return next(new Error('Sesión no válida.'));
        socket.user = user;
        return next();
      }).catch(() => next(new Error('No se pudo validar la sesión.')));
      return undefined;
    } catch {
      return next(new Error('Sesión no válida o vencida.'));
    }
  });

  io.on('connection', socket => {
    const authenticatedUserId = String(socket.user.id);
    socket.join(`user:${authenticatedUserId}`);

    // El usuario solo puede unirse a su propia sala; se ignora cualquier ID del cliente.
    socket.on('join-user', userId => {
      if (String(userId) !== authenticatedUserId) return;
      socket.join(`user:${authenticatedUserId}`);
    });

    socket.on('typing', payload => {
      const receiverId = String(payload?.receiverId || '').trim();
      if (!receiverId || receiverId === authenticatedUserId) return;
      io.to(`user:${receiverId}`).emit('typing', { userId: authenticatedUserId });
    });

    socket.on('stop-typing', payload => {
      const receiverId = String(payload?.receiverId || '').trim();
      if (!receiverId || receiverId === authenticatedUserId) return;
      io.to(`user:${receiverId}`).emit('stop-typing', { userId: authenticatedUserId });
    });

    socket.on('message-sent', payload => {
      const receiverId = String(payload?.receiver_id || payload?.receiverId || '').trim();
      if (!receiverId || receiverId === authenticatedUserId) return;
      io.to(`user:${receiverId}`).emit('message-received', {
        ...payload,
        sender_id: authenticatedUserId,
        sender_name: socket.user.name,
      });
    });
  });
}

export function createApp({ enableSockets = true, enableLocalUploads = true, beforeRoutes = null } = {}) {
  const app = express();
  const httpServer = enableSockets ? http.createServer(app) : null;
  const io = enableSockets ? new Server(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
  }) : null;
  if (io) configureSockets(io);

  // Vercel Functions tienen un sistema de archivos de solo lectura; las cargas
  // persistentes deben enviarse a Blob/S3, no al disco del proceso.
  const uploadPath = enableLocalUploads ? path.resolve(process.cwd(), env.uploadDir) : null;
  let upload = null;
  if (enableLocalUploads) {
    fs.mkdirSync(uploadPath, { recursive: true });
    const storage = multer.diskStorage({
      destination: (_req, _file, callback) => callback(null, uploadPath),
      filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase().slice(0, 10);
        callback(null, `${Date.now()}-${randomUUID()}${extension}`);
      },
    });
    upload = multer({
      storage,
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_UPLOAD_TYPES.has(file.mimetype)) {
          const error = new Error('Tipo de archivo no permitido. Usa imágenes, PDF o texto plano.');
          error.status = 415;
          return callback(error);
        }
        return callback(null, true);
      },
    });
  }

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(...security);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));

  // Servir frontend estático si Express recibe peticiones a la raíz o recursos
  const publicPath = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  app.get('/', (_req, res) => {
    const indexPath = path.resolve(process.cwd(), 'public/index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.json({ ok: true, message: 'Servi Choquib API activa' });
  });

  if (beforeRoutes) {
    app.use((req, res, next) => {
      Promise.resolve().then(() => beforeRoutes(req, res)).then(() => next()).catch(next);
    });
  }
  app.use('/api', apiLimiter);

  app.get('/api/health', async (_req, res, next) => {
    try {
      if (!env.db.connectionString && env.nodeEnv === 'production' && !env.db.password) {
        return res.status(503).json({
          ok: false,
          database: 'disconnected',
          message: 'DATABASE_URL no configurada en las variables de entorno de Vercel.',
        });
      }
      const { query } = await import('./database/db.js');
      await query('SELECT 1');
      return res.json({ ok: true, database: 'connected', service: 'Servi Choquib API' });
    } catch (error) {
      return next(error);
    }
  });
  app.get('/api-docs.json', (_req, res) => res.json(openapi));
  app.get('/swagger-init.js', (_req, res) => res.type('application/javascript').send(
    "window.addEventListener('load', () => SwaggerUIBundle({ url: '/api-docs.json', dom_id: '#swagger-ui', deepLinking: true, persistAuthorization: true }));",
  ));
  app.get('/api-docs', (_req, res) => res.type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Servi Choquib API - Swagger</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script src="/swagger-init.js"></script></body></html>`));

  app.use('/api', authRoutes);
  app.use('/api', appRoutes);
  if (enableLocalUploads && upload) {
    app.post('/api/uploads', auth, upload.single('file'), uploadFile);
    app.use('/uploads', express.static(uploadPath, { fallthrough: false, index: false }));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return { app, httpServer, io, uploadPath };
}
