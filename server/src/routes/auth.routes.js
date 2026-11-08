import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../utils/async-handler.js';
import { validateRequest } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import * as controller from '../controllers/auth.controller.js';

const router = Router();
const loginValidation = [
  body('identifier').trim().isEmail().withMessage('Correo inválido.'),
  body('password').isString().notEmpty().withMessage('Contraseña requerida.'),
  validateRequest,
];

router.post('/login', authLimiter, loginValidation, asyncHandler(controller.login));
router.post('/register', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
  body('email').trim().isEmail().withMessage('Correo inválido.'),
  body('password').isString().isLength({ min: 8, max: 128 }).withMessage('La contraseña debe tener entre 8 y 128 caracteres.'),
  body('role').optional().isIn(['cliente', 'prestador']).withMessage('Rol no válido.'),
  validateRequest,
], asyncHandler(controller.register));
router.post('/password/forgot', authLimiter, [
  body('identifier').trim().isEmail().withMessage('Correo inválido.'),
  validateRequest,
], asyncHandler(controller.requestPasswordReset));
router.post('/password/reset', authLimiter, [
  body('identifier').trim().isEmail().withMessage('Correo inválido.'),
  body('code').trim().matches(/^\d{6}$/).withMessage('El código debe tener 6 dígitos.'),
  body('new_password').isLength({ min: 8, max: 128 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres.'),
  validateRequest,
], asyncHandler(controller.resetPassword));
router.get('/me', auth, controller.getCurrentUser);
router.get('/profile', auth, controller.getCurrentUser);
router.put('/profile', auth, asyncHandler(controller.updateProfile));

export default router;
