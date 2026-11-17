import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as controller from '../controllers/payments.controller.js';

const router = Router();
router.post('/payments/checkout', auth, [
  body('bookingId').trim().notEmpty().withMessage('La reserva es obligatoria.'),
  validateRequest,
], asyncHandler(controller.createCheckout));
router.get('/payments/status/:bookingId', auth, asyncHandler(controller.paymentStatus));
// Sin auth de usuario: Rapyd firma cada llamada y se valida con HMAC.
router.post('/payments/webhook', asyncHandler(controller.webhook));
export default router;
