import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { initializeDatabase, closeDatabase } from './database/db.js';
import { seedDemoData } from './store/seed.js';

export async function startServer({ port = env.port } = {}) {
  await initializeDatabase();
  if (env.seedDemoData) await seedDemoData();
  const server = createApp();
  await new Promise((resolve, reject) => {
    server.httpServer.once('error', reject);
    server.httpServer.listen(port, '0.0.0.0', resolve);
  });
  console.log(`Servi Choquib API escuchando en el puerto ${port}`);
  const databaseTarget = env.db.connectionString
    ? 'DATABASE_URL configurada'
    : `${env.db.host}:${env.db.port}/${env.db.database}`;
  console.log(`PostgreSQL conectado: ${databaseTarget} (esquema ${env.db.schema})`);
  return server;
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  let server;
  const shutdown = async signal => {
    console.log(`\n${signal}: cerrando Servi Choquib...`);
    if (server?.httpServer?.listening) {
      await new Promise(resolve => server.httpServer.close(resolve));
    }
    server?.io?.close();
    await closeDatabase().catch(() => {});
    process.exit(0);
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  startServer().then(value => { server = value; }).catch(async error => {
    console.error('No se pudo iniciar Servi Choquib API. Revisa la conexión PostgreSQL y server/.env:', error.message);
    await closeDatabase().catch(() => {});
    process.exitCode = 1;
  });
}
