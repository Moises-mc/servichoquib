import { BookingModel } from '../models/booking.model.js';
import { ReviewModel } from '../models/review.model.js';
import { ServiceModel } from '../models/service.model.js';
import { HttpError } from '../utils/http-error.js';
export async function createReview(req, res) {
  const booking = await BookingModel.findById(req.body.bookingId);
  if (!booking || String(booking.client_id) !== String(req.user.id)) throw new HttpError(404, 'Reserva no encontrada.');
  if (booking.status !== 'completado') throw new HttpError(400, 'Solo puedes calificar servicios completados.');
  if (await ReviewModel.findByBooking(booking.id)) throw new HttpError(409, 'Ya calificaste esta reserva.');
  try {
    const review = await ReviewModel.create({ bookingId: booking.id, serviceId: booking.service_id, providerId: booking.provider_id, userId: req.user.id, rating: Number(req.body.rating), comment: String(req.body.comment || '').trim() });
    if (booking.service_id) await ServiceModel.updateRating(booking.service_id);
    return res.status(201).json({ reviewId: review.id });
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, 'Ya calificaste esta reserva.');
    throw error;
  }
}
