import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as controller from '../controllers/admin.controller.js';

const router = Router();
router.use(auth, requireAdmin);
router.get('/admin/dashboard', asyncHandler(controller.dashboard));
router.patch('/admin/users/:id/status', [
  body('isActive').isBoolean().withMessage('El estado debe ser verdadero o falso.'),
  validateRequest,
], asyncHandler(controller.setUserStatus));
router.patch('/admin/services/:id/status', [
  body('available').isBoolean().withMessage('La disponibilidad debe ser verdadera o falsa.'),
  validateRequest,
], asyncHandler(controller.setServiceStatus));

export default router;
