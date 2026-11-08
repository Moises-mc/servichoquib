import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as controller from '../controllers/services.controller.js';

const router = Router();
const serviceValidation = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('El título debe tener entre 3 y 120 caracteres.'),
  body('price').isFloat({ gt: 0, max: 100000000 }).withMessage('El precio debe ser mayor que cero.'),
  body('category').trim().isLength({ min: 2, max: 60 }).withMessage('Selecciona una categoría válida.'),
  body('desc').optional().isString().isLength({ max: 2000 }).withMessage('La descripción es demasiado larga.'),
  body('unit').optional().isString().isLength({ max: 60 }),
  body('location').optional().isString().isLength({ max: 160 }),
  validateRequest,
];

router.get('/services', asyncHandler(controller.listServices));
router.post('/services', auth, serviceValidation, asyncHandler(controller.createService));
router.put('/services/:id', auth, [
  body('title').optional().trim().isLength({ min: 3, max: 120 }),
  body('price').optional().isFloat({ gt: 0, max: 100000000 }),
  body('category').optional().trim().isLength({ min: 2, max: 60 }),
  body('desc').optional().isString().isLength({ max: 2000 }),
  body('unit').optional().isString().isLength({ max: 60 }),
  body('location').optional().isString().isLength({ max: 160 }),
  body('available').optional().isBoolean(),
  validateRequest,
], asyncHandler(controller.updateService));
router.delete('/services/:id', auth, asyncHandler(controller.deleteService));

export default router;
