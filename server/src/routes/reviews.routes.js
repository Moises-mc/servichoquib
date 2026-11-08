import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createReview } from '../controllers/reviews.controller.js';

const router = Router();
router.post('/reviews', auth, [
  body('bookingId').trim().notEmpty().withMessage('La reserva es obligatoria.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe estar entre 1 y 5.'),
  body('comment').optional().isString().isLength({ max: 2000 }),
  validateRequest,
], asyncHandler(createReview));
export default router;
