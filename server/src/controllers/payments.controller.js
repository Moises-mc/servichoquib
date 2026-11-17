import { BookingModel } from '../models/booking.model.js';
import { HttpError } from '../utils/http-error.js';
import { env } from '../config/env.js';
import { createHostedCheckout, verifyWebhookSignature } from '../services/rapyd.service.js';

// La URL de retorno solo puede ser uno de los orígenes configurados (evita redirecciones abiertas).
function resolveReturnBase(req) {
  const origin = req.headers.origin;
  if (origin && env.clientOrigins.includes(origin)) return origin;
  return env.clientOrigins[0];
}

export async function createCheckout(req, res) {
  const booking = await BookingModel.findById(req.body.bookingId);
  if (!booking) throw new HttpError(404, 'Reserva no encontrada.');
  if (String(booking.client_id) !== String(req.user.id)) throw new HttpError(403, 'Solo el cliente de la reserva puede pagarla.');
  if (booking.status === 'cancelado') throw new HttpError(400, 'No se puede pagar una reserva cancelada.');
  if (Number(booking.paid) === 1) throw new HttpError(409, 'Esta reserva ya fue pagada.');
  // El monto sale siempre de la base de datos, nunca del cliente.
  const checkout = await createHostedCheckout({ booking, returnBase: resolveReturnBase(req) });
  await BookingModel.update(booking, { payment_checkout_id: checkout.id, payment_status: 'pendiente' });
  return res.json({ ok: true, checkoutId: checkout.id, checkoutUrl: checkout.redirectUrl });
}

export async function paymentStatus(req, res) {
  const booking = await BookingModel.findById(req.params.bookingId);
  if (!booking) throw new HttpError(404, 'Reserva no encontrada.');
  const involved = [booking.client_id, booking.provider_id].some(id => String(id) === String(req.user.id));
  if (!involved && req.user.role !== 'admin') throw new HttpError(403, 'No tienes acceso a esta reserva.');
  return res.json({
    bookingId: booking.id, title: booking.title, currency: 'COP', total: booking.total,
    paid: Number(booking.paid) === 1, paymentStatus: booking.payment_status, paymentAmount: booking.payment_amount,
  });
}

const FAILURE_STATUS = { PAYMENT_FAILED: 'fallido', PAYMENT_EXPIRED: 'expirado', PAYMENT_CANCELED: 'cancelado' };

export async function webhook(req, res) {
  const derived = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const valid = verifyWebhookSignature({
    headers: { salt: req.get('salt'), timestamp: req.get('timestamp'), signature: req.get('signature') },
    rawBody: req.rawBody,
    candidateUrls: [env.rapyd.webhookUrl, derived, req.originalUrl],
  });
  if (!valid) return res.status(401).json({ error: 'Firma de webhook no válida.' });

  const { type, data = {} } = req.body || {};
  const bookingId = data.merchant_reference_id || data.metadata?.booking_id;
  const booking = bookingId ? await BookingModel.findById(bookingId) : null;
  if (!booking) return res.status(200).json({ received: true }); // evento ajeno: se reconoce sin actuar
  if (Number(booking.paid) === 1) return res.status(200).json({ received: true }); // idempotente

  if (type === 'PAYMENT_COMPLETED') {
    const amountMatches = Number(data.amount) === Number(booking.total);
    const currency = data.currency_code || data.currency;
    if (!amountMatches || (currency && currency !== env.rapyd.currency)) {
      console.error(`Pago ${bookingId} con monto/moneda inesperados`, data.amount, currency);
      await BookingModel.update(booking, { payment_status: 'revisar' });
    } else {
      await BookingModel.update(booking, { paid: 1, payment_amount: booking.total, paid_at: new Date(), payment_status: 'pagado' });
    }
  } else if (FAILURE_STATUS[type]) {
    await BookingModel.update(booking, { payment_status: FAILURE_STATUS[type] });
  }
  return res.status(200).json({ received: true });
}
