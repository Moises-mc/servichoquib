import { UserModel } from '../models/user.model.js';
import { ServiceModel } from '../models/service.model.js';
import { HttpError } from '../utils/http-error.js';
import { MessageModel } from '../models/message.model.js';
export async function listContacts(req, res) {
  const contacts = (await UserModel.findAll()).filter(user => String(user.id) !== String(req.user.id)).map(UserModel.toPublic);
  return res.json({ contacts });
}
export async function listConversations(req, res) {
  const contacts = (await MessageModel.findConversationContacts(req.user.id)).map(UserModel.toPublic);
  return res.json({ contacts });
}
export async function getPublicProfile(req, res) {
  const user = await UserModel.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Perfil no encontrado.');
  return res.json({ user: UserModel.toPublic(user), services: await ServiceModel.findAllByOwner(user.id) });
}
