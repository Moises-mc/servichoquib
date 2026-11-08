import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as controller from '../controllers/bookings.controller.js';

const router = Router();
router.get('/bookings', auth, asyncHandler(controller.listBookings));
router.post('/bookings', auth, [
  body('serviceId').trim().notEmpty().withMessage('El servicio es obligatorio.'),
  body('date').isISO8601().withMessage('La fecha de la reserva no es válida.'),
  body('note').optional().isString().isLength({ max: 1000 }),
  validateRequest,
], asyncHandler(controller.createBooking));
router.put('/bookings/:id', auth, [
  body('status').isIn(['confirmado', 'completado', 'cancelado']).withMessage('Estado de reserva no válido.'),
  validateRequest,
], asyncHandler(controller.updateBooking));
export default router;
