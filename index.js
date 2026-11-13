import express from 'express';
import { createApp } from './server/src/app.js';
import { env } from './server/src/config/env.js';
import { initializeDatabase } from './server/src/database/db.js';
import { seedDemoData } from './server/src/store/seed.js';
import { UserModel } from './server/src/models/user.model.js';
import { hashPassword } from './server/src/utils/password-hasher.js';


// Recupera la cuenta administradora mediante secretos configurados en Vercel.
// Nunca se utiliza una contraseña pública/de demostración en producción.
async function ensureBootstrapAdmin() {
  const { email, password } = env.adminBootstrap;
  if (!password) {
    console.warn('ADMIN_BOOTSTRAP_PASSWORD no está configurada; se omite la recuperación automática del administrador.');
    return;
  }
  if (password.length < 12) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD debe tener al menos 12 caracteres.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL no contiene un correo válido.');
  }
  const passwordHash = await hashPassword(password);
  const existing = await UserModel.findByEmail(email);
  if (existing) {
    await UserModel.update(existing, {
      role: 'admin', passwordHash, emailVerified: true, isActive: true,
      name: existing.name || 'Administrador',
    });
    return;
  }
  await UserModel.create({
    id: 'servi_choquib_admin', name: 'Administrador', email, role: 'admin',
    passwordHash, emailVerified: true, phoneVerified: false, isActive: true,
    avatar: 'AD', location: 'Servi Choquib',
  });
}

// Express se despliega como una Vercel Function. Los archivos del frontend
// viven en /public y son entregados por la CDN de Vercel.
let initializationPromise;
async function initializeOnce() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await initializeDatabase();
      await ensureBootstrapAdmin();
      if (env.seedDemoData) await seedDemoData();
    })().catch(error => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}

const { app } = createApp({
  // La instancia se crea aquí para que Vercel detecte Express directamente
  // en el entrypoint configurado (index.js).
  app: express(),
  enableSockets: false,       // Socket.IO no se usa en el frontend actual.
  enableLocalUploads: false, // Los archivos persistentes requieren Blob/S3.
  beforeRoutes: initializeOnce,
});

// La exportación default es el contrato de Express en Vercel.
export default app;
