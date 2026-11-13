import { hashPassword, comparePassword } from '../utils/password-hasher.js';
import { randomInt } from 'node:crypto';
import { UserModel } from '../models/user.model.js';
import { PasswordResetModel } from '../models/password-reset.model.js';
import { VerificationModel } from '../models/verification.model.js';
import { sendEmailCode, sendSmsCode } from '../services/notifications.service.js';
import { HttpError } from '../utils/http-error.js';
import { signUser } from '../middleware/auth.js';

const PROFILE_FIELDS = ['name', 'phone', 'location', 'bio', 'specialty', 'availability', 'profile_image'];

export async function login(req, res) {
  const email = req.body.identifier.trim().toLowerCase();
  const user = await UserModel.findByEmail(email);
  if (!user || !(await comparePassword(req.body.password, user.passwordHash))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  if (!user.emailVerified) throw new HttpError(403, 'Debes verificar tu correo antes de iniciar sesión.');
  return res.json({ user: UserModel.toPublic(user), token: signUser(user) });
}

export async function register(req, res) {
  const email = req.body.email.trim().toLowerCase();
  if (await UserModel.findByEmail(email)) throw new HttpError(409, 'Ese correo ya está registrado.');
  const name = req.body.name.trim();
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const pending = { name, email, phone: String(req.body.phone || '').trim(), role: req.body.role === 'prestador' ? 'prestador' : 'cliente', passwordHash: await hashPassword(req.body.password) };
  await VerificationModel.saveRegistration(pending, code, Date.now() + 10 * 60 * 1000);
  try { await sendEmailCode(email, code, 'verificar tu cuenta'); }
  catch (error) { await VerificationModel.deleteRegistration(email); throw new HttpError(503, error.message); }
  return res.status(202).json({ requiresVerification: true, email, message: 'Te enviamos un código de 6 dígitos a tu correo. Vence en 10 minutos.' });
}

export async function verifyRegistration(req, res) {
  const email = req.body.email.trim().toLowerCase();
  const pending = await VerificationModel.getRegistration(email, req.body.code.trim());
  if (!pending) throw new HttpError(400, 'El código no es válido, venció o superaste los intentos. Solicita uno nuevo.');
  if (await UserModel.findByEmail(email)) { await VerificationModel.deleteRegistration(email); throw new HttpError(409, 'Ese correo ya está registrado.'); }
  const name = pending.name;
  const user = await UserModel.create({ name, email, phone: pending.phone, role: pending.role, passwordHash: pending.password_hash,
    emailVerified: true, phoneVerified: false, avatar: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(), location: 'Quibdó' });
  await VerificationModel.deleteRegistration(email);
  return res.status(201).json({ user: UserModel.toPublic(user), token: signUser(user) });
}

export async function requestPhoneVerification(req, res) {
  if (!req.user.phone) throw new HttpError(400, 'Agrega primero un número de teléfono a tu perfil.');
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await VerificationModel.savePhone(req.user.id, code, Date.now() + 10 * 60 * 1000);
  try { await sendSmsCode(req.user.phone, code); }
  catch (error) { await VerificationModel.deletePhone(req.user.id); throw new HttpError(503, error.message); }
  return res.json({ message: 'Enviamos un código a tu teléfono. Vence en 10 minutos.' });
}

export async function verifyPhone(req, res) {
  const valid = await VerificationModel.verifyPhone(req.user.id, req.body.code.trim());
  if (!valid) throw new HttpError(400, 'El código no es válido o venció.');
  const user = await UserModel.update(req.user, { phoneVerified: true });
  await VerificationModel.deletePhone(req.user.id);
  return res.json({ user: UserModel.toPublic(user), message: 'Número telefónico verificado.' });
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
  if (Object.hasOwn(changes, 'phone') && changes.phone !== String(req.user.phone || '')) changes.phoneVerified = false;
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
  const method = req.body.method === 'sms' ? 'sms' : 'email';
  const user = await UserModel.findByEmail(email);
  // Respuesta genérica para no revelar si una cuenta existe.
  if (user) {
    if (method === 'sms' && (!user.phone || !user.phoneVerified)) {
      return res.json({ message: 'Si la cuenta existe y el método está habilitado, enviaremos el código por SMS. Si no tienes un teléfono verificado, usa el correo.' });
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await PasswordResetModel.save(email, code, Date.now() + 10 * 60 * 1000, method);
    try {
      if (method === 'sms') await sendSmsCode(user.phone, code);
      else await sendEmailCode(email, code, 'restablecer tu contraseña');
    } catch (error) { await PasswordResetModel.delete(email); throw new HttpError(503, error.message); }
  }
  return res.json({ message: `Si la cuenta existe y el método está habilitado, enviaremos el código por ${method === 'sms' ? 'SMS' : 'correo'}.` });
}

export async function resetPassword(req, res) {
  const email = req.body.identifier.trim().toLowerCase();
  const user = await UserModel.findByEmail(email);
  const valid = user && user.emailVerified && await PasswordResetModel.verify(email, req.body.code.trim());
  if (!valid) throw new HttpError(400, 'El código no es válido o ha vencido. Solicita uno nuevo.');
  const passwordHash = await hashPassword(req.body.new_password);
  await UserModel.update(user, { passwordHash });
  await PasswordResetModel.delete(email);
  return res.json({ message: 'Contraseña actualizada correctamente.' });
}
