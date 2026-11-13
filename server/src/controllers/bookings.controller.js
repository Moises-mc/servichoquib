import { BookingModel } from '../models/booking.model.js';
import { ServiceModel } from '../models/service.model.js';
import { HttpError } from '../utils/http-error.js';

const ALLOWED_TRANSITIONS = {
  pendiente: new Set(['confirmado', 'cancelado']),
  confirmado: new Set(['completado', 'cancelado']),
};

export async function listBookings(req, res) {
  return res.json({ bookings: await BookingModel.findByUser(req.user) });
}

export async function createBooking(req, res) {
  const service = await ServiceModel.findById(req.body.serviceId);
  if (!service || !service.available) throw new HttpError(404, 'El servicio no está disponible.');
  if (String(service.ownerId) === String(req.user.id)) throw new HttpError(400, 'No puedes reservar tu propio servicio.');
  const booking = await BookingModel.create({
    service_id: service.id, client_id: req.user.id, provider_id: service.ownerId,
    title: service.title, provider: service.provider, client: req.user.name,
    date: req.body.date, note: String(req.body.note || '').trim(), status: 'pendiente',
    total: Number(service.price), commission: Math.round(Number(service.price) * 0.1), paid: 0, payment_amount: 0,
  });
  return res.status(201).json({ bookingId: booking.id, booking });
}

export async function updateBooking(req, res) {
  const booking = await BookingModel.findById(req.params.id);
  if (!booking) throw new HttpError(404, 'Reserva no encontrada.');
  const isClient = String(booking.client_id) === String(req.user.id);
  const isProvider = String(booking.provider_id) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';
  if (!isClient && !isProvider && !isAdmin) throw new HttpError(403, 'No tienes permiso para modificar esta reserva.');
  const nextStatus = req.body.status;
  const isAllowed = isAdmin || ((isProvider && ALLOWED_TRANSITIONS[booking.status]?.has(nextStatus)) ||
    (isClient && nextStatus === 'cancelado' && ['pendiente', 'confirmado'].includes(booking.status)) ||
    false);
  if (!isAllowed) throw new HttpError(403, 'No puedes realizar ese cambio de estado.');
  const changes = { status: nextStatus };
  if (nextStatus === 'cancelado') {
    changes.paid = 0;
    changes.payment_amount = 0;
    changes.paid_at = null;
  }
  const updated = await BookingModel.update(booking, changes);
  return res.json({ ok: true, payment_amount: updated.payment_amount || 0, paid: Boolean(updated.paid), message: nextStatus === 'completado' ? 'Servicio finalizado. El pago aún no está habilitado.' : undefined });
}
