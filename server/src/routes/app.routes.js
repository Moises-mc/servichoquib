import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { users, services, bookings, messages, reviews, publicUser } from '../store/memory.js';

const router = Router();
router.get('/services', (req, res) => res.json({ services }));
router.post('/services', auth, (req, res) => { const item = { ...req.body, id: `s${Date.now()}`, ownerId: req.user.id, provider: req.user.name, avatar: req.user.avatar, rating: 0, reviews: 0, available: true }; services.unshift(item); res.status(201).json({ service: item }); });
router.put('/services/:id', auth, (req, res) => { const item = services.find(x => x.id === req.params.id && x.ownerId === req.user.id); if (!item) return res.status(404).json({ error: 'Servicio no encontrado.' }); Object.assign(item, req.body); res.json({ service: item }); });
router.delete('/services/:id', auth, (req, res) => { const i = services.findIndex(x => x.id === req.params.id && x.ownerId === req.user.id); if (i < 0) return res.status(404).json({ error: 'Servicio no encontrado.' }); services.splice(i, 1); res.json({ ok: true }); });
router.get('/contacts', auth, (req, res) => res.json({ contacts: users.filter(x => x.id !== req.user.id).map(publicUser) }));
router.get('/users/:id', auth, (req, res) => {
  const user = users.find(item => String(item.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: 'Perfil no encontrado.' });
  const userServices = services.filter(item => String(item.ownerId) === String(user.id));
  res.json({ user: publicUser(user), services: userServices });
});
router.get('/bookings', auth, (req, res) => res.json({ bookings: bookings.filter(x => x.client_id === req.user.id || x.provider_id === req.user.id) }));
router.post('/bookings', auth, (req, res) => { const service = services.find(x => x.id === String(req.body.serviceId)); if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' }); const item = { id: `b${Date.now()}`, service_id: service.id, client_id: req.user.id, provider_id: service.ownerId, title: service.title, provider: service.provider, client: req.user.name, date: req.body.date, note: req.body.note || '', status: 'pendiente', total: Number(service.price), commission: Math.round(Number(service.price) * .1), paid: 0 }; bookings.unshift(item); res.status(201).json({ bookingId: item.id, booking: item }); });
router.put('/bookings/:id', auth, (req, res) => { const item = bookings.find(x => x.id === req.params.id); if (!item) return res.status(404).json({ error: 'Reserva no encontrada.' }); item.status = req.body.status; if (item.status === 'completado') { item.paid = 1; item.payment_amount = item.total - item.commission; } res.json({ ok: true, payment_amount: item.payment_amount || 0, paid: Boolean(item.paid) }); });
router.get('/messages', auth, (req, res) => { const withId = String(req.query.with || ''); const list = withId ? messages.filter(x => (x.sender_id === req.user.id && x.receiver_id === withId) || (x.receiver_id === req.user.id && x.sender_id === withId)) : messages.filter(x => x.sender_id === req.user.id || x.receiver_id === req.user.id); res.json({ messages: list }); });
router.post('/messages', auth, (req, res) => { const text = String(req.body.text || '').trim(); const receiverId = String(req.body.receiverId || ''); const attachment = req.body.attachment || null; if ((!text && !attachment) || !receiverId) return res.status(400).json({ error: 'Mensaje incompleto.' }); const item = { id: `m${Date.now()}`, sender_id: req.user.id, receiver_id: receiverId, text, attachment, created_at: new Date().toISOString() }; messages.push(item); res.status(201).json({ message: item }); });
router.put('/messages/:id', auth, (req, res) => { const item = messages.find(x => x.id === req.params.id && x.sender_id === req.user.id); if (!item) return res.status(404).json({ error: 'Mensaje no encontrado.' }); const text = String(req.body.text || '').trim(); if (!text) return res.status(400).json({ error: 'El mensaje no puede estar vacío.' }); item.text = text; item.edited_at = new Date().toISOString(); res.json({ message: item }); });
router.delete('/messages/:id', auth, (req, res) => { const index = messages.findIndex(x => x.id === req.params.id && x.sender_id === req.user.id); if (index < 0) return res.status(404).json({ error: 'Mensaje no encontrado.' }); messages.splice(index, 1); res.json({ ok: true }); });
router.delete('/conversations/:contactId', auth, (req, res) => { const contactId = String(req.params.contactId); for (let index = messages.length - 1; index >= 0; index -= 1) { const item = messages[index]; if ((item.sender_id === req.user.id && item.receiver_id === contactId) || (item.receiver_id === req.user.id && item.sender_id === contactId)) messages.splice(index, 1); } res.json({ ok: true }); });
router.post('/reviews', auth, (req, res) => { const item = { ...req.body, id: `r${Date.now()}`, userId: req.user.id }; reviews.push(item); res.status(201).json({ reviewId: item.id }); });
export default router;
