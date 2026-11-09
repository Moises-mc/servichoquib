import express from 'express';
import { createApp } from './server/src/app.js';
import { env } from './server/src/config/env.js';
import { initializeDatabase } from './server/src/database/db.js';
import { seedDemoData } from './server/src/store/seed.js';

// Express se despliega como una Vercel Function. Los archivos del frontend
// viven en /public y son entregados por la CDN de Vercel y Express.
let initializationPromise;
async function initializeOnce() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const initialized = await initializeDatabase();
      if (initialized && env.seedDemoData) await seedDemoData();
    })().catch(error => {
      console.warn('[DB] Inicialización de base de datos diferida:', error.message);
      initializationPromise = null;
    });
  }
  return initializationPromise;
}

const { app } = createApp({
  enableSockets: false,       // Socket.IO no se usa en el frontend actual.
  enableLocalUploads: false, // Los archivos persistentes requieren Blob/S3.
  beforeRoutes: initializeOnce,
});

// La exportación default es el contrato de Express en Vercel.
export default app;
