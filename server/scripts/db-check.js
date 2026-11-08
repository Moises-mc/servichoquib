import { initializeDatabase, query, closeDatabase, table } from '../src/database/db.js';
try {
  await initializeDatabase();
  const { rows } = await query(`SELECT current_database() AS database, current_schema() AS schema, COUNT(*)::int AS users FROM ${table('users')}`);
  console.log(`PostgreSQL conectado: ${rows[0].database}; esquema: servi_choquib; usuarios: ${rows[0].users}`);
} catch (error) {
  console.error('No se pudo verificar PostgreSQL:', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase().catch(() => {});
}
