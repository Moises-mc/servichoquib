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

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: env.clientOrigin, credentials: true } });
const uploadPath = path.resolve(env.uploadDir);
fs.mkdirSync(uploadPath, { recursive: true });
const upload = multer({ dest: uploadPath, limits: { fileSize: 5 * 1024 * 1024 } });

app.disable('x-powered-by');
app.use(...security);
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiLimiter);
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'Servi Choquib API' }));
app.use('/api', authLimiter, authRoutes);
app.use('/api', appRoutes);
app.post('/api/uploads', upload.single('file'), (req, res) => { if (!req.file) return res.status(400).json({ error: 'Archivo requerido.' }); res.status(201).json({ file: { name: req.file.originalname, path: `/uploads/${req.file.filename}`, size: req.file.size } }); });
app.use('/uploads', express.static(uploadPath));
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, req, res, next) => { console.error(error); res.status(500).json({ error: 'Error interno del servidor.' }); });

io.on('connection', socket => {
  socket.on('join-user', userId => socket.join(`user:${String(userId)}`));
  socket.on('typing', ({ receiverId, userId }) => io.to(`user:${String(receiverId)}`).emit('typing', { userId }));
  socket.on('stop-typing', ({ receiverId, userId }) => io.to(`user:${String(receiverId)}`).emit('stop-typing', { userId }));
  socket.on('message-sent', message => io.to(`user:${String(message.receiver_id)}`).emit('message-received', message));
});

await seedDemoData();
httpServer.listen(env.port, () => console.log(`Servi Choquib API: http://localhost:${env.port}`));
