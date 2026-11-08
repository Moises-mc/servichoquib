import { MessageModel } from '../models/message.model.js';
import { UserModel } from '../models/user.model.js';
import { HttpError } from '../utils/http-error.js';
const MAX_ATTACHMENT_BYTES = 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'application/pdf', 'application/msword',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
]);
function validateAttachment(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'El adjunto no tiene un formato válido.');
  const type = String(value.type || '').toLowerCase();
  const name = String(value.name || 'archivo').trim().slice(0, 255);
  const dataUrl = String(value.dataUrl || '');
  const prefix = `data:${type};base64,`;
  const encoded = dataUrl.startsWith(prefix) ? dataUrl.slice(prefix.length) : '';
  if (!ALLOWED_ATTACHMENT_TYPES.has(type) || !encoded || !/^(?:[a-z0-9+/]{4})*(?:[a-z0-9+/]{2}==|[a-z0-9+/]{3}=)?$/i.test(encoded)) throw new HttpError(400, 'El tipo o contenido del adjunto no está permitido.');
  const content = Buffer.from(encoded, 'base64');
  if (!content.length || content.length > MAX_ATTACHMENT_BYTES) throw new HttpError(413, 'El adjunto debe tener un tamaño máximo de 1 MB.');
  return { name: name || 'archivo', type, size: content.length, dataUrl };
}
export async function listMessages(req, res) {
  const partnerId = String(req.query.with || '').trim();
  if (partnerId && !(await UserModel.findById(partnerId))) throw new HttpError(404, 'Contacto no encontrado.');
  return res.json({ messages: await MessageModel.findForUser(req.user.id, partnerId) });
}
export async function createMessage(req, res) {
  const receiverId = String(req.body.receiverId || '').trim();
  const text = String(req.body.text || '').trim();
  const attachment = req.body.attachment ? validateAttachment(req.body.attachment) : null;
  if (!receiverId || (!text && !attachment)) throw new HttpError(400, 'Mensaje incompleto.');
  if (String(receiverId) === String(req.user.id)) throw new HttpError(400, 'No puedes enviarte mensajes a ti mismo.');
  if (!(await UserModel.findById(receiverId))) throw new HttpError(404, 'El destinatario no existe.');
  const message = await MessageModel.create({ sender_id: req.user.id, receiver_id: receiverId, sender_name: req.user.name, text, attachment });
  return res.status(201).json({ message });
}
export async function updateMessage(req, res) {
  const message = await MessageModel.findById(req.params.id);
  if (!message || String(message.sender_id) !== String(req.user.id)) throw new HttpError(404, 'Mensaje no encontrado.');
  const text = String(req.body.text || '').trim();
  if (!text) throw new HttpError(400, 'El mensaje no puede estar vacío.');
  return res.json({ message: await MessageModel.update(message, { text }) });
}
export async function deleteMessage(req, res) {
  const message = await MessageModel.findById(req.params.id);
  if (!message || String(message.sender_id) !== String(req.user.id)) throw new HttpError(404, 'Mensaje no encontrado.');
  await MessageModel.delete(message);
  return res.json({ ok: true });
}
export async function deleteConversation(req, res) {
  const contactId = String(req.params.contactId);
  if (!(await UserModel.findById(contactId))) throw new HttpError(404, 'Contacto no encontrado.');
  const deleted = await MessageModel.deleteConversation(req.user.id, contactId);
  return res.json({ ok: true, deleted });
}
