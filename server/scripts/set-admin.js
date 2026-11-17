// Crea o actualiza la cuenta de administrador directamente en la base de datos.
// Uso (desde la carpeta server/):
//   ADMIN_EMAIL=tu@correo.com ADMIN_PASSWORD='una-clave-larga' npm run admin:set
// Opcional: ADMIN_FROM_EMAIL=correo-actual-del-admin (por defecto admin@servicios.co, o el primer admin que exista).
import { initializeDatabase, query, closeDatabase, table } from '../src/database/db.js';
import { UserModel } from '../src/models/user.model.js';
import { hashPassword } from '../src/utils/password-hasher.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const fromEmail = String(process.env.ADMIN_FROM_EMAIL || '').trim().toLowerCase();

try {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL no es un correo válido.');
  if (password.length < 12 || password.length > 128) throw new Error('ADMIN_PASSWORD debe tener entre 12 y 128 caracteres.');
  await initializeDatabase();

  let admin = fromEmail ? await UserModel.findByEmail(fromEmail) : await UserModel.findByEmail('admin@servicios.co');
  if (!admin) {
    const { rows } = await query(`SELECT id FROM ${table('users')} WHERE role = 'admin' ORDER BY created_at LIMIT 1`);
    admin = rows[0] ? await UserModel.findById(rows[0].id) : null;
  }
  if (admin && admin.role !== 'admin') throw new Error('La cuenta indicada en ADMIN_FROM_EMAIL no es administradora.');

  const owner = await UserModel.findByEmail(email);
  if (owner && (!admin || String(owner.id) !== String(admin.id))) throw new Error('Ese correo ya pertenece a otra cuenta.');

  const passwordHash = await hashPassword(password);
  if (admin) {
    await UserModel.update(admin, { email, passwordHash, emailVerified: true, isActive: true });
    console.log(`Administrador actualizado: ${email}`);
  } else {
    await UserModel.create({ name: 'Administrador', email, role: 'admin', avatar: 'AD', location: 'Servi Choquib', passwordHash, emailVerified: true });
    console.log(`Administrador creado: ${email}`);
  }
} catch (error) {
  console.error('No se pudo configurar el administrador:', error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase().catch(() => {});
}
