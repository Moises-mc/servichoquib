import { ServiceModel } from '../models/service.model.js';
import { HttpError } from '../utils/http-error.js';
const EDITABLE_FIELDS = ['title', 'price', 'category', 'desc', 'unit', 'location', 'available'];
export async function listServices(_req, res) {
  return res.json({ services: await ServiceModel.findAll() });
}
export async function createService(req, res) {
  const title = req.body.title.trim();
  const price = Number(req.body.price);
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, 'El precio debe ser un número mayor que cero.');
  const service = await ServiceModel.create({
    title, price, category: req.body.category.trim(), desc: String(req.body.desc || '').trim(),
    unit: String(req.body.unit || 'por servicio').trim(), location: String(req.body.location || req.user.location || 'Quibdó').trim(),
    ownerId: req.user.id, provider: req.user.name, avatar: req.user.avatar, rating: 0, reviews: 0, available: true,
  });
  return res.status(201).json({ service });
}
export async function updateService(req, res) {
  const service = await ServiceModel.findByOwner(req.params.id, req.user.id);
  if (!service) throw new HttpError(404, 'Servicio no encontrado.');
  const changes = Object.fromEntries(EDITABLE_FIELDS.filter(field => Object.hasOwn(req.body, field)).map(field => [field, req.body[field]]));
  if (Object.hasOwn(changes, 'title')) changes.title = String(changes.title).trim();
  if (Object.hasOwn(changes, 'price')) {
    changes.price = Number(changes.price);
    if (!Number.isFinite(changes.price) || changes.price <= 0) throw new HttpError(400, 'El precio debe ser un número mayor que cero.');
  }
  if (Object.hasOwn(changes, 'available') && typeof changes.available !== 'boolean') throw new HttpError(400, 'El estado de disponibilidad no es válido.');
  const updated = await ServiceModel.update(service, changes);
  return res.json({ service: updated });
}
export async function deleteService(req, res) {
  const service = await ServiceModel.findByOwner(req.params.id, req.user.id);
  if (!service) throw new HttpError(404, 'Servicio no encontrado.');
  await ServiceModel.delete(service);
  return res.json({ ok: true });
}
