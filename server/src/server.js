import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { initializeDatabase, closeDatabase } from './database/db.js';
import { seedDemoData } from './store/seed.js';

export async function startServer({ port = env.port } = {}) {
  await initializeDatabase();
  await seedDemoData();
  const server = createApp();
  await new Promise((resolve, reject) => {
    server.httpServer.once('error', reject);
    server.httpServer.listen(port, resolve);
  });
  console.log(`Servi Choquib API disponible en http://localhost:${port}`);
  console.log(`PostgreSQL conectado: ${env.db.host}:${env.db.port}/${env.db.database} (esquema ${env.db.schema})`);
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
