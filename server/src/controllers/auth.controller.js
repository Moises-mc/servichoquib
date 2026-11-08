import { hashPassword, comparePassword } from '../utils/password-hasher.js';
import { randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import { UserModel } from '../models/user.model.js';
import { PasswordResetModel } from '../models/password-reset.model.js';
import { HttpError } from '../utils/http-error.js';
import { signUser } from '../middleware/auth.js';

const PROFILE_FIELDS = ['name', 'phone', 'location', 'bio', 'specialty', 'availability', 'profile_image'];

export async function login(req, res) {
  const email = req.body.identifier.trim().toLowerCase();
  const user = await UserModel.findByEmail(email);
  if (!user || !(await comparePassword(req.body.password, user.passwordHash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  return res.json({ user: UserModel.toPublic(user), token: signUser(user) });
}

export async function register(req, res) {
  const email = req.body.email.trim().toLowerCase();
  if (await UserModel.findByEmail(email)) throw new HttpError(409, 'Ese correo ya está registrado.');
  const name = req.body.name.trim();
  let user;
  try {
    user = await UserModel.create({
      name, email, phone: String(req.body.phone || '').trim(),
      role: req.body.role === 'prestador' ? 'prestador' : 'cliente',
      passwordHash: await hashPassword(req.body.password),
      avatar: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
      location: 'Quibdó',
    });
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, 'Ese correo ya está registrado.');
    throw error;
  }
  return res.status(201).json({ user: UserModel.toPublic(user), token: signUser(user) });
}

export function getCurrentUser(req, res) {
  return res.json({ user: UserModel.toPublic(req.user) });
}

export async function updateProfile(req, res) {
  const changes = Object.fromEntries(
    PROFILE_FIELDS.filter(field => Object.hasOwn(req.body, field))
      .map(field => [field, typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]]),
  );
  const limits = { name: 100, phone: 40, location: 160, bio: 4000, specialty: 120, availability: 60 };
  for (const [field, value] of Object.entries(changes)) {
    if (typeof value !== 'string') throw new HttpError(400, `El campo ${field} debe ser texto.`);
    if (field !== 'profile_image' && value.length > limits[field]) throw new HttpError(400, `El campo ${field} supera la longitud permitida.`);
  }
  if (Object.hasOwn(changes, 'name') && changes.name.length < 2) throw new HttpError(400, 'El nombre debe tener al menos 2 caracteres.');
  if (Object.hasOwn(changes, 'availability') && !['Disponible para solicitudes', 'Solo con cita previa', 'No disponible temporalmente'].includes(changes.availability)) {
    throw new HttpError(400, 'La disponibilidad seleccionada no es válida.');
  }
  if (Object.hasOwn(changes, 'profile_image')) {
    const image = changes.profile_image;
    if (image.length > 1_800_000) throw new HttpError(413, 'La imagen de perfil supera el tamaño permitido.');
    if (image && !/^(https?:\/\/|data:image\/(jpeg|png|webp|gif);base64,)/i.test(image)) throw new HttpError(400, 'La imagen de perfil debe ser una URL HTTP o una imagen válida.');
  }
  const updated = await UserModel.update(req.user, changes);
  return res.json({ user: UserModel.toPublic(updated) });
}

export async function requestPasswordReset(req, res) {
  const email = req.body.identifier.trim().toLowerCase();
  const user = await UserModel.findByEmail(email);
  if (user) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await PasswordResetModel.save(email, code, Date.now() + 10 * 60 * 1000);
    if (env.nodeEnv !== 'production') console.info(`[RECUPERACIÓN DEMO] Código para ${email}: ${code}`);
  }
  if (env.nodeEnv === 'production') throw new HttpError(503, 'La recuperación por correo no está configurada en este despliegue.');
  return res.json({ message: 'Si el correo está registrado, se generó un código de recuperación. Revisa la consola del servidor en modo demo.' });
}

export async function resetPassword(req, res) {
  const email = req.body.identifier.trim().toLowerCase();
  const user = await UserModel.findByEmail(email);
  const valid = user && await PasswordResetModel.verify(email, req.body.code.trim());
  if (!valid) throw new HttpError(400, 'El código no es válido o ha vencido. Solicita uno nuevo.');
  const passwordHash = await hashPassword(req.body.new_password);
  await UserModel.update(user, { passwordHash });
  await PasswordResetModel.delete(email);
  return res.json({ message: 'Contraseña actualizada correctamente.' });
}
