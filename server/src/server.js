import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { security, apiLimiter, authLimiter } from './middleware/security.js';
import authRoutes from './routes/auth.routes.js';
import appRoutes from './routes/app.routes.js';
import { seedDemoData } from './store/seed.js';
import { openapi } from './docs/openapi.js';

// Express recibe las peticiones HTTP: GET, POST, PUT y DELETE.
const app = express();
// El servidor HTTP permite que Express y Socket.IO compartan el mismo puerto.
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: env.clientOrigin, credentials: true } });

// Multer guarda los archivos recibidos en esta carpeta local.
const uploadPath = path.resolve(env.uploadDir);
fs.mkdirSync(uploadPath, { recursive: true });
const upload = multer({ dest: uploadPath, limits: { fileSize: 5 * 1024 * 1024 } });

// Swagger es una pagina separada de la API.
app.get('/api-docs.json', (req, res) => res.json(openapi));
app.get('/api-docs', (req, res) => res.type('html').send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Servi Choquib API - Swagger</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api-docs.json', dom_id: '#swagger-ui', deepLinking: true, persistAuthorization: true });</script></body></html>`));

// --- Middleware global: se ejecuta antes de llegar a las rutas. ---
app.disable('x-powered-by');
app.use(...security);
app.use(express.json({ limit: '2mb' })); // Convierte JSON recibido en req.body.
app.use('/api', apiLimiter); // Limita solicitudes repetidas.

// --- Rutas HTTP ---
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Servi Choquib API' }));
app.use('/api', authLimiter, authRoutes); // Login, registro y perfil.
app.use('/api', appRoutes); // Servicios, reservas, chat y resenas.

app.post('/api/uploads', upload.single('file'), (req, res) => {
  // Multer deja el archivo recibido en req.file.
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido.' });
  return res.status(201).json({
    file: { name: req.file.originalname, path: `/uploads/${req.file.filename}`, size: req.file.size },
  });
});
app.use('/uploads', express.static(uploadPath));

// Si ninguna ruta respondio, la URL solicitada no existe.
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
// Captura errores inesperados en un solo lugar.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Socket.IO maneja eventos en tiempo real; no son rutas HTTP.
io.on('connection', socket => {
  socket.on('join-user', userId => socket.join(`user:${String(userId)}`));
  socket.on('typing', ({ receiverId, userId }) => io.to(`user:${String(receiverId)}`).emit('typing', { userId }));
  socket.on('stop-typing', ({ receiverId, userId }) => io.to(`user:${String(receiverId)}`).emit('stop-typing', { userId }));
  socket.on('message-sent', message => io.to(`user:${String(message.receiver_id)}`).emit('message-received', message));
});

// Crea datos de demostracion antes de empezar a atender peticiones.
await seedDemoData();
httpServer.listen(env.port, () => console.log(`Servi Choquib API: http://localhost:${env.port}`));
